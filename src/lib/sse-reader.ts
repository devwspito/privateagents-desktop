/**
 * Shared SSE stream reader — parses Server-Sent Events from a Response body.
 *
 * Handles: TextDecoder buffering, line splitting, "data: " prefix extraction,
 * JSON parsing, and SSE comment skipping.
 */
export async function readSSEStream(
  response: Response,
  onEvent: (data: unknown) => void,
): Promise<void> {
  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n")
      buffer = lines.pop() || ""

      for (const line of lines) {
        if (line.startsWith(":")) continue
        if (!line.startsWith("data: ")) continue
        const jsonStr = line.slice(6).trim()
        if (!jsonStr) continue
        try {
          onEvent(JSON.parse(jsonStr))
        } catch {
          // Malformed JSON — skip
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}
