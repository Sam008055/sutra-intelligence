import mammoth from 'mammoth'

const MAX_CHUNK_SIZE = 1200
const MIN_CHUNK_SIZE = 100

/**
 * Parse a document buffer and return text chunks.
 * For PDFs: Uses LlamaParse API for enterprise-grade OCR and parsing.
 */
export async function parseAndChunk(buffer: Buffer, filetype: string): Promise<string[] | null> {
  try {
    let text = ''

    if (filetype === 'application/pdf') {
      console.log("Sending PDF to LlamaParse...")
      text = await parseWithLlamaParse(buffer)
    } else if (
      filetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      filetype === 'application/msword'
    ) {
      const data = await mammoth.extractRawText({ buffer })
      text = data.value
    } else {
      return null
    }

    if (!text || text.trim().length < 50) {
      console.error(`Text extraction too short: ${text?.length || 0} chars`)
      throw new Error("Document contains no readable text or is empty.")
    }

    console.log(`Extracted ${text.length} chars, semantically chunking...`)
    return semanticChunkText(text)
  } catch (error) {
    console.error('Extraction Error:', error)
    throw error // Bubble up the error to Inngest to trigger failure_reason
  }
}

async function parseWithLlamaParse(buffer: Buffer): Promise<string> {
  const apiKey = process.env.LLAMAPARSE_API_KEY
  if (!apiKey) {
    throw new Error("LLAMAPARSE_API_KEY is not set in environment variables.")
  }

  // 1. Upload
  const formData = new FormData();
  // Next.js fetch API FormData supports Blobs
  const blob = new Blob([buffer], { type: 'application/pdf' });
  formData.append("file", blob, "document.pdf");

  const uploadRes = await fetch("https://api.cloud.llamaindex.ai/api/parsing/upload", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`
    },
    body: formData
  });

  if (!uploadRes.ok) {
    const errText = await uploadRes.text()
    throw new Error(`LlamaParse upload failed: ${uploadRes.status} ${errText}`)
  }

  const uploadData = await uploadRes.json();
  const jobId = uploadData.id;
  console.log(`LlamaParse Job ID: ${jobId}. Polling for completion...`)

  // 2. Poll for completion
  let resultMarkdown = "";
  let attempts = 0;
  const maxAttempts = 60; // 2 minutes max (2000ms * 60)

  while (attempts < maxAttempts) {
    await new Promise(r => setTimeout(r, 2000));
    attempts++;

    const statusRes = await fetch(`https://api.cloud.llamaindex.ai/api/parsing/job/${jobId}`, {
       headers: { "Authorization": `Bearer ${apiKey}` }
    });
    
    if (!statusRes.ok) continue;
    
    const statusData = await statusRes.json();
    
    if (statusData.status === "SUCCESS") {
      const markdownRes = await fetch(`https://api.cloud.llamaindex.ai/api/parsing/job/${jobId}/result/markdown`, {
        headers: { "Authorization": `Bearer ${apiKey}` }
      });
      const markdownData = await markdownRes.json();
      resultMarkdown = markdownData.markdown;
      break;
    } else if (statusData.status === "ERROR") {
      throw new Error("LlamaParse job failed during processing.");
    }
  }

  if (!resultMarkdown) {
    throw new Error("LlamaParse timed out after 2 minutes.");
  }

  return resultMarkdown;
}

/**
 * Split text into semantic chunks based on paragraphs (\n\n) and headers.
 * Groups small paragraphs together up to MAX_CHUNK_SIZE.
 */
function semanticChunkText(text: string): string[] {
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
