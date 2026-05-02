import { inngest } from "./client";
import { createAdminClient } from "@/lib/supabase-admin";
import { parseAndChunk } from "@/lib/chunker";
import { generateEmbeddingsBatch } from "@/lib/embeddings";

export const processDocument = inngest.createFunction(
  { id: "process-document", triggers: [{ event: "app/document.process" }] },
  async ({ event, step }) => {
    const { documentId, companyId, storagePath, fileType } = event.data;
    const adminSupabase = createAdminClient();

    // Step 1: Download and parse the document
    const chunks = await step.run("parse-and-chunk", async () => {
      // Download the file
      const { data, error } = await adminSupabase.storage
        .from("documents")
        .download(storagePath);
      
      if (error || !data) throw new Error("Failed to download file from storage: " + error?.message);
      
      // Parse it directly in the same step
      const arrayBuffer = await data.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      let extractedChunks: string[] | null = null;
      try {
        extractedChunks = await parseAndChunk(buffer, fileType);
      } catch (err: any) {
        await adminSupabase.from("documents").update({ status: "failed", failure_reason: err.message || "Failed to parse document" }).eq("id", documentId);
        throw err;
      }
      
      if (!extractedChunks || extractedChunks.length === 0) {
        await adminSupabase.from("documents").update({ status: "failed", failure_reason: "Document contains no readable text." }).eq("id", documentId);
        throw new Error("Could not extract text from document");
      }
      return extractedChunks;
    });

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
