import AnsiToHtml from 'ansi-to-html'

// Create ANSI to HTML converter with custom options
const ansiConverter = new AnsiToHtml({
  fg: '#FFF',
  bg: '#000',
  newline: false,
  escapeXML: false,
  stream: false,
  colors: {
    0: '#000000', // black
    1: '#FF0000', // red
    2: '#00FF00', // green
    3: '#FFFF00', // yellow
    4: '#0000FF', // blue
    5: '#FF00FF', // magenta
    6: '#00FFFF', // cyan
    7: '#FFFFFF', // white
    8: '#808080', // bright black (gray)
    9: '#FF8080', // bright red
    10: '#80FF80', // bright green
    11: '#FFFF80', // bright yellow
    12: '#8080FF', // bright blue
    13: '#FF80FF', // bright magenta
    14: '#80FFFF', // bright cyan
    15: '#FFFFFF' // bright white
  }
})

/**
 * Convert ANSI escape sequences to HTML with proper colors
 * @param ansiText - Raw text with ANSI escape sequences
 * @returns HTML string with colored spans
 */
export function convertAnsiToHtml(ansiText: string): string {
  try {
    return ansiConverter.toHtml(ansiText)
  } catch (error) {
    console.warn('Failed to convert ANSI to HTML:', error)
    // Fallback: strip ANSI codes if conversion fails
    return stripAnsiCodes(ansiText)
  }
}

/**
 * Strip ANSI escape sequences from text (fallback)
 * @param text - Text with ANSI escape sequences
 * @returns Clean text without ANSI codes
 */
export function stripAnsiCodes(text: string): string {
  // Remove ANSI escape sequences
  return text.replace(/\u001b\[[0-9;]*m/g, '')
}

/**
 * Clean and format log lines for better readability
 * @param logs - Raw log text
 * @returns Formatted HTML string
 */
export function formatLogsWithAnsi(logs: string): string {
  const lines = logs.split('\n')
  const formattedLines = lines
    .map((line) => {
      if (!line.trim()) return ''

      // Convert ANSI to HTML
      const htmlLine = convertAnsiToHtml(line)

      // Clean up Docker log prefixes (w, n, v, etc.) and timestamps
      const cleanedLine = htmlLine
        .replace(/^[a-z]\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z\s*/, '') // Remove Docker prefix and ISO timestamp
        .replace(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}:\d{1,4}\s+/, '') // Remove custom timestamp format (1 to 4 digits)
        .trim()

      return cleanedLine
    })
    .filter((line) => line.length > 0)

  return formattedLines.join('\n')
}
