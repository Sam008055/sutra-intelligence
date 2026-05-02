import mammoth from 'mammoth'

const MAX_CHUNK_SIZE = 1200
const MIN_CHUNK_SIZE = 100

export async function uploadToLlamaParse(buffer: Buffer): Promise<string> {
  const apiKey = process.env.LLAMAPARSE_API_KEY
  if (!apiKey) throw new Error("LLAMAPARSE_API_KEY is not set.")

  const formData = new FormData();
  const blob = new Blob([buffer], { type: 'application/pdf' });
  formData.append("file", blob, "document.pdf");

  const uploadRes = await fetch("https://api.cloud.llamaindex.ai/api/parsing/upload", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}` },
    body: formData
  });

  if (!uploadRes.ok) {
    const errText = await uploadRes.text()
    throw new Error(`LlamaParse upload failed: ${uploadRes.status} ${errText}`)
  }

  const uploadData = await uploadRes.json();
  return uploadData.id;
}

export async function checkLlamaParseStatus(jobId: string): Promise<{status: string, markdown?: string}> {
  const apiKey = process.env.LLAMAPARSE_API_KEY
  if (!apiKey) throw new Error("LLAMAPARSE_API_KEY is not set.")

  const statusRes = await fetch(`https://api.cloud.llamaindex.ai/api/parsing/job/${jobId}`, {
     headers: { "Authorization": `Bearer ${apiKey}` }
  });
  
  if (!statusRes.ok) return { status: 'PENDING' };
  
  const statusData = await statusRes.json();
  
  if (statusData.status === "SUCCESS") {
    const markdownRes = await fetch(`https://api.cloud.llamaindex.ai/api/parsing/job/${jobId}/result/markdown`, {
      headers: { "Authorization": `Bearer ${apiKey}` }
    });
    const markdownData = await markdownRes.json();
    return { status: "SUCCESS", markdown: markdownData.markdown };
  } else if (statusData.status === "ERROR") {
    return { status: "ERROR" };
  }

  return { status: statusData.status };
}

export async function parseWordDocument(buffer: Buffer): Promise<string[] | null> {
  try {
    const data = await mammoth.extractRawText({ buffer })
    const text = data.value

    if (!text || text.trim().length < 50) {
      throw new Error("Document contains no readable text or is empty.")
    }

    return semanticChunkText(text)
  } catch (error) {
    throw error
  }
}

/**
 * Split text into semantic chunks based on paragraphs (\n\n) and headers.
 * Groups small paragraphs together up to MAX_CHUNK_SIZE.
 */
export function semanticChunkText(text: string): string[] {
  // Normalize whitespace but preserve paragraph breaks
  const normalized = text.replace(/\n{3,}/g, '\n\n').trim()
  
  // Split by semantic boundaries (double newline)
  const paragraphs = normalized.split('\n\n')
  
  const chunks: string[] = []
  let currentChunk = ""

  for (const paragraph of paragraphs) {
    const cleanPara = paragraph.replace(/[ \t]+/g, ' ').trim()
    if (!cleanPara) continue

    // If adding this paragraph exceeds max size, push current chunk and start new
    if (currentChunk.length + cleanPara.length > MAX_CHUNK_SIZE && currentChunk.length > MIN_CHUNK_SIZE) {
      chunks.push(currentChunk.trim())
      
      // Implement Overlap: take the last sentence of the previous chunk to start the new one
      const sentences = currentChunk.match(/[^.!?]+[.!?]+/g) || []
      const overlap = sentences.slice(-2).join(' ').trim() // Last 2 sentences
      
      currentChunk = overlap + (overlap ? " " : "") + cleanPara
    } else {
      currentChunk += (currentChunk ? "\n\n" : "") + cleanPara
    }
  }

  if (currentChunk.length > 50) {
    chunks.push(currentChunk.trim())
  }

  return chunks
}
