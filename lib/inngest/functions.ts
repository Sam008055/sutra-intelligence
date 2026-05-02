import { inngest } from "./client";
import { createAdminClient } from "@/lib/supabase-admin";
import { parseAndChunk } from "@/lib/chunker";
import { generateEmbeddingsBatch } from "@/lib/embeddings";

export const processDocument = inngest.createFunction(
  { id: "process-document", triggers: [{ event: "app/document.process" }] },
  async ({ event, step }) => {
    const { documentId, companyId, storagePath, fileType } = event.data;
    const adminSupabase = createAdminClient();

    // Step 1: Download and start parsing
    let chunks: string[] = [];

    if (fileType === 'application/pdf') {
      // FAST PATH: Try local pdf-parse first
      const fastChunks = await step.run("fast-path-extract", async () => {
        const { data, error } = await adminSupabase.storage.from("documents").download(storagePath);
        if (error || !data) throw new Error("Failed to download file from storage: " + error?.message);
        
        const { parseWithPdfParse } = await import("@/lib/chunker");
        const arrayBuffer = await data.arrayBuffer();
        return await parseWithPdfParse(Buffer.from(arrayBuffer));
      });

      if (fastChunks && fastChunks.length > 0) {
        // Fast path succeeded! Skip LlamaParse.
        chunks = fastChunks;
      } else {
        // DEEP PATH: Fast path failed (scanned document or empty text). Fallback to LlamaParse.
        const jobId = await step.run("upload-to-llamaparse", async () => {
          const { data, error } = await adminSupabase.storage.from("documents").download(storagePath);
          if (error || !data) throw new Error("Failed to download file from storage: " + error?.message);
          const { uploadToLlamaParse } = await import("@/lib/chunker");
          const arrayBuffer = await data.arrayBuffer();
          return await uploadToLlamaParse(Buffer.from(arrayBuffer));
        });

      // Poll LlamaParse using Inngest step.sleep
      let status = 'PENDING';
      let resultMarkdown = '';
      let attempts = 0;

      while (status !== 'SUCCESS' && attempts < 30) {
        await step.sleep(`wait-for-parse-${attempts}`, "5s");
        
        const pollResult = await step.run(`check-status-${attempts}`, async () => {
          const { checkLlamaParseStatus } = await import("@/lib/chunker");
          return await checkLlamaParseStatus(jobId);
        });

        status = pollResult.status;
        if (status === 'SUCCESS' && pollResult.markdown) {
          resultMarkdown = pollResult.markdown;
        } else if (status === 'ERROR') {
          await adminSupabase.from("documents").update({ status: "failed", failure_reason: "LlamaParse job failed." }).eq("id", documentId);
          throw new Error("LlamaParse job failed during processing.");
        }
        attempts++;
      }

      if (!resultMarkdown) {
        await adminSupabase.from("documents").update({ status: "failed", failure_reason: "LlamaParse timed out." }).eq("id", documentId);
        throw new Error("LlamaParse timed out.");
      }

      chunks = await step.run("chunk-pdf-text", async () => {
        const { semanticChunkText } = await import("@/lib/chunker");
        return semanticChunkText(resultMarkdown);
      });
    }

    } else {
      chunks = await step.run("parse-and-chunk-word", async () => {
        const { data, error } = await adminSupabase.storage.from("documents").download(storagePath);
        if (error || !data) throw new Error("Failed to download file from storage: " + error?.message);
        
        const { parseWordDocument } = await import("@/lib/chunker");
        const arrayBuffer = await data.arrayBuffer();
        const extracted = await parseWordDocument(Buffer.from(arrayBuffer));
        if (!extracted || extracted.length === 0) {
          throw new Error("Document contains no readable text");
        }
        return extracted;
      });
    }

    if (!chunks || chunks.length === 0) {
      await adminSupabase.from("documents").update({ status: "failed", failure_reason: "Document contains no readable text." }).eq("id", documentId);
      throw new Error("Could not extract text from document");
    }

    // Step 3: Embed chunks (done directly since step.run doesn't support nested retries well for long batches, 
    // and embeddingsBatch handles its own internal rate-limits/retries).
    const successCount = await step.run("embed-and-store", async () => {
      // We pass the batch size of 3 as configured in embeddings.ts
      const embeddings = await generateEmbeddingsBatch(chunks, 3);
      
      let count = 0;
      for (let i = 0; i < chunks.length; i++) {
        const embedding = embeddings[i];
        if (!embedding) continue;

        try {
          const { error: chunkError } = await adminSupabase
            .from('chunks')
            .insert({
              document_id: documentId,
              company_id: companyId,
              content: chunks[i],
              embedding: `[${embedding.join(',')}]`
            });
          if (!chunkError) count++;
        } catch (err) {
          console.error("Chunk insert failed:", err);
        }
      }
      
      return count;
    });

    // Step 4: Finalize
    await step.run("finalize-document", async () => {
      if (successCount >= chunks.length * 0.5) {
        await adminSupabase.from("documents").update({ status: "ready" }).eq("id", documentId);
      } else {
        const msg = `Only ${successCount}/${chunks.length} chunks processed. Rate limits or chunking errors.`;
        await adminSupabase.from("documents").update({ status: "failed", failure_reason: msg }).eq("id", documentId);
        throw new Error(msg);
      }
    });

    return { success: true, chunksProcessed: successCount };
  }
);
