const GEMINI_API_KEY = process.env.GEMINI_API_KEY!
const EMBED_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${GEMINI_API_KEY}`

/**
 * Generate an embedding for a text chunk with automatic retry on rate limits.
 */
export async function generateEmbedding(text: string, retries = 3): Promise<number[]> {
  const truncated = text.length > 8000 ? text.slice(0, 8000) : text

  for (let attempt = 0; attempt <= retries; attempt++) {
    const response = await fetch(EMBED_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: { parts: [{ text: truncated }] },
        outputDimensionality: 768
      })
    })

    if (response.ok) {
      const data = await response.json()
      return data.embedding.values
    }

    // Handle rate limiting with retry
    if (response.status === 429 && attempt < retries) {
      const retryMatch = (await response.text()).match(/retry in (\d+)/i)
      const waitSeconds = retryMatch ? parseInt(retryMatch[1]) + 2 : 10 * (attempt + 1)
      console.log(`[Embedding] Rate limited. Waiting ${waitSeconds}s before retry ${attempt + 1}/${retries}...`)
      await new Promise(resolve => setTimeout(resolve, waitSeconds * 1000))
      continue
    }

    const errorBody = await response.text()
    console.error(`Gemini embedding error (${response.status}): ${errorBody}`)
    throw new Error(`Embedding API error: ${response.status}`)
  }

  throw new Error('Embedding failed after max retries')
}

/**
 * Process embeddings in parallel batches to speed up ingestion
 * while respecting Gemini API rate limits (100 req/min on free tier).
 */
export async function generateEmbeddingsBatch(
  chunks: string[],
  batchSize: number = 3
): Promise<(number[] | null)[]> {
  const results: (number[] | null)[] = []

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize)

    const batchResults = await Promise.allSettled(
      batch.map(chunk => generateEmbedding(chunk))
    )

    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value)
      } else {
        console.error('Embedding failed for a chunk:', result.reason)
        results.push(null)
      }
    }

    // Longer delay between batches to stay within 100 req/min
    if (i + batchSize < chunks.length) {
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }

  return results
}
