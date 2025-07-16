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
 * Parses a Python-like object representation into JavaScript object
 * Example: "ReasoningStep(title='...', action='...', ...)" -> { title: '...', action: '...', ... }
 */
function parsePythonObject(pythonStr: string): unknown {
  try {
    // Handle simple types
    if (pythonStr === 'None') return null
    if (pythonStr === 'True') return true
    if (pythonStr === 'False') return false
    if (!isNaN(Number(pythonStr))) return Number(pythonStr)
    if (pythonStr.startsWith("'") && pythonStr.endsWith("'")) {
      return pythonStr
        .substring(1, pythonStr.length - 1)
        .replace(/\\'/g, "'")
        .replace(/\\n/g, '\n')
    }

    // Handle arrays
    if (pythonStr.startsWith('[') && pythonStr.endsWith(']')) {
      const arrayContent = pythonStr.substring(1, pythonStr.length - 1)
      if (!arrayContent.trim()) return []

      // Simple split by comma won't work for nested structures,
      // so we need to parse more carefully
      const items: unknown[] = []
      let current = ''
      let depth = 0
      let inString = false

      for (let i = 0; i < arrayContent.length; i++) {
        const char = arrayContent[i]
        if (char === "'" && arrayContent[i - 1] !== '\\') {
          inString = !inString
        }
        if (!inString) {
          if (char === '(' || char === '[' || char === '{') depth++
          if (char === ')' || char === ']' || char === '}') depth--
          if (char === ',' && depth === 0) {
            items.push(parsePythonObject(current.trim()))
            current = ''
            continue
          }
        }
        current += char
      }
      if (current.trim()) {
        items.push(parsePythonObject(current.trim()))
      }
      return items
    }

    // Handle Python objects like ReasoningStep(...) or RunResponseExtraData(...)
    const objectMatch = pythonStr.match(/^(\w+)\(([\s\S]*)\)$/)
    if (objectMatch) {
      const [, , propsStr] = objectMatch
      const obj: Record<string, unknown> = {}

      // Parse key=value pairs for any class
      let current = ''
      let depth = 0
      let inString = false
      let key = ''
      let parsingKey = true

      for (let i = 0; i < propsStr.length; i++) {
        const char = propsStr[i]
        if (char === "'" && propsStr[i - 1] !== '\\') {
          inString = !inString
        }
        if (!inString) {
          if (char === '(' || char === '[' || char === '{') depth++
          if (char === ')' || char === ']' || char === '}') depth--
          if (char === '=' && depth === 0 && parsingKey) {
            key = current.trim()
            current = ''
            parsingKey = false
            continue
          }
          if (char === ',' && depth === 0) {
            if (key) {
              obj[key] = parsePythonObject(current.trim())
            }
            current = ''
            key = ''
            parsingKey = true
            continue
          }
        }
        current += char
      }
      if (key && current.trim()) {
        obj[key] = parsePythonObject(current.trim())
      }

      return obj
    }

    // Handle NextAction enum
    if (pythonStr.includes('<NextAction.')) {
      const enumMatch = pythonStr.match(/<NextAction\.(\w+):\s*'([^']+)'>/)
      if (enumMatch) {
        return enumMatch[2] // Return the string value, not the enum
      }
    }

    // If nothing else matches, return the original string
    return pythonStr
  } catch (error) {
    console.error('Error parsing Python object:', error, pythonStr)
    return pythonStr
  }
}

/**
 * Extracts complete JSON objects from a buffer string **incrementally**.
 * - It allows partial JSON objects to accumulate across chunks.
 * - It ensures real-time streaming updates.
 */
function parseEventString(eventString: string): RunResponse | null {
  const match = eventString.match(/\s*RunResponseContentEvent\(([\s\S]*)\)$/)
  if (!match) {
    return null
  }

  console.log('Parsing event string:', eventString.substring(0, 200) + '...')

  const propsString = match[1]
  const eventData: Record<string, unknown> = {}

  // Parse key=value pairs more carefully to handle nested structures
  let current = ''
  let depth = 0
  let inString = false
  let key = ''
  let parsingKey = true

  for (let i = 0; i < propsString.length; i++) {
    const char = propsString[i]
    if (char === "'" && propsString[i - 1] !== '\\') {
      inString = !inString
    }
    if (!inString) {
      if (char === '(' || char === '[' || char === '{') depth++
      if (char === ')' || char === ']' || char === '}') depth--
      if (char === '=' && depth === 0 && parsingKey) {
        key = current.trim()
        current = ''
        parsingKey = false
        continue
      }
      if (char === ',' && depth === 0) {
        if (key) {
          const parsedValue = parsePythonObject(current.trim())
          eventData[key] = parsedValue
          if (key === 'extra_data') {
            console.log(
              'Parsed extra_data key:',
              key,
              'value:',
              current.trim().substring(0, 100)
            )
            console.log('Parsed extra_data object:', parsedValue)
          }
        }
        current = ''
        key = ''
        parsingKey = true
        continue
      }
    }
    current += char
  }
  if (key && current.trim()) {
    const parsedValue = parsePythonObject(current.trim())
    eventData[key] = parsedValue
    if (key === 'extra_data') {
      console.log(
        'Final extra_data key:',
        key,
        'value:',
        current.trim().substring(0, 100)
      )
      console.log('Final extra_data object:', parsedValue)
    }
  }

  const result = {
    event: (eventData.event || 'RunResponseContent') as RunEvent,
    content: eventData.content as string | object | undefined,
    content_type: (eventData.content_type as string) || 'str',
    run_id: eventData.run_id as string | undefined,
    agent_id: eventData.agent_id as string | undefined,
    session_id: eventData.session_id as string | undefined,
    created_at: (eventData.created_at as number) || Date.now(),
    extra_data: eventData.extra_data as RunResponse['extra_data'],
    thinking: eventData.thinking as string | undefined,
    citations: eventData.citations,
    response_audio: eventData.response_audio as RunResponse['response_audio'],
    image: eventData.image
  } as RunResponse

  // Debug logging для extra_data
  if (eventData.extra_data) {
    console.log('Final parsed extra_data:', eventData.extra_data)
    console.log('Full result:', result)
  }

  return result
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
