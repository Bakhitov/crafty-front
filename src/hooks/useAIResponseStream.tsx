import { useCallback } from 'react'
import { type RunResponse, type RunEvent } from '@/types/playground'

/**
 * Processes a single JSON chunk by passing it to the provided callback.
 * @param chunk - A parsed JSON object of type RunResponse.
 * @param onChunk - Callback to handle the chunk.
 */
function processChunk(
  chunk: RunResponse,
  onChunk: (chunk: RunResponse) => void
) {
  onChunk(chunk)
}

/**
 * Parses a string buffer to extract complete JSON objects.
 *
 * This function discards any extraneous data before the first '{', then
 * repeatedly finds and processes complete JSON objects.
 *
 * @param text - The accumulated string buffer.
 * @param onChunk - Callback to process each parsed JSON object.
 * @returns Remaining string that did not form a complete JSON object.
 */
/**
 * Extracts complete JSON objects from a buffer string **incrementally**.
 * - It allows partial JSON objects to accumulate across chunks.
 * - It ensures real-time streaming updates.
 */
function parseEventString(eventString: string): RunResponse | null {
  const match = eventString.match(/\s*RunResponseContentEvent\((.*)\)/)
  if (!match) {
    return null
  }

  const propsString = match[1]
  const props = propsString.split(/,(?=\s*\w+=)/)

  const eventData: Partial<RunResponse> = {}
  props.forEach((prop) => {
    const [key, ...valueParts] = prop.trim().split('=')
    let value: string | number | null = valueParts.join('=')

    if (value === 'None') {
      value = null
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.substring(1, value.length - 1).replace(/\\n/g, '\n')
    } else if (!isNaN(Number(value))) {
      value = Number(value)
    }
    ;(eventData as Record<string, unknown>)[key] = value
  })

  return {
    event: (eventData.event || 'RunResponseContent') as RunEvent,
    content: eventData.content,
    content_type: eventData.content_type || 'str',
    run_id: eventData.run_id,
    agent_id: eventData.agent_id,
    session_id: eventData.session_id,
    created_at: eventData.created_at || Date.now()
    // Add other fields from RunResponse that might be in the event
  } as RunResponse
}

function parseBuffer(
  buffer: string,
  onChunk: (chunk: RunResponse) => void
): string {
  const lines = buffer.split('\n')
  const incomplete = lines.pop() || ''

  for (const line of lines) {
    if (line.startsWith('data:')) {
      const eventString = line.substring(5)
      if (eventString) {
        const parsedChunk = parseEventString(eventString)
        if (parsedChunk) {
          processChunk(parsedChunk, onChunk)
        }
      }
    }
  }

  return incomplete
}

/**
 * Custom React hook to handle streaming API responses as JSON objects.
 *
 * This hook:
 * - Accumulates partial JSON data from streaming responses.
 * - Extracts complete JSON objects and processes them via onChunk.
 * - Handles errors via onError and signals completion with onComplete.
 *
 * @returns An object containing the streamResponse function.
 */
export default function useAIResponseStream() {
  const streamResponse = useCallback(
    async (options: {
      apiUrl: string
      headers?: Record<string, string>
      requestBody: FormData | Record<string, unknown>
      onChunk: (chunk: RunResponse) => void
      onError: (error: Error) => void
      onComplete: () => void
    }): Promise<void> => {
      const {
        apiUrl,
        headers = {},
        requestBody,
        onChunk,
        onError,
        onComplete
      } = options

      // Buffer to accumulate partial JSON data.
      let buffer = ''

      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            // Set content-type only for non-FormData requests.
            ...(!(requestBody instanceof FormData) && {
              'Content-Type': 'application/json'
            }),
            ...headers
          },
          body:
            requestBody instanceof FormData
              ? requestBody
              : JSON.stringify(requestBody)
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw errorData
        }

        if (!response.body) {
          throw new Error('No response body')
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()

        // Recursively process the stream.
        const processStream = async (): Promise<void> => {
          const { done, value } = await reader.read()
          if (done) {
            // End of stream. Process the entire buffer.
            // Add a newline to make sure the last line is processed by parseBuffer.
            parseBuffer(buffer + '\n', onChunk)
            onComplete()
            return
          }
          // Decode, sanitize, and accumulate the chunk
          buffer += decoder.decode(value, { stream: true })

          // Parse any complete JSON objects available in the buffer.
          buffer = parseBuffer(buffer, onChunk)
          await processStream()
        }
        await processStream()
      } catch (error) {
        if (typeof error === 'object' && error !== null && 'detail' in error) {
          onError(new Error(String(error.detail)))
        } else {
          onError(new Error(String(error)))
        }
      }
    },
    []
  )

  return { streamResponse }
}
