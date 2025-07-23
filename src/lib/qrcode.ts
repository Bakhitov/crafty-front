import QRCode from 'qrcode'

/**
 * Convert QR code text to Data URL image
 */
export async function generateQRCodeImage(text: string): Promise<string> {
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    })
    return dataUrl
  } catch (error) {
    console.error('Error generating QR code:', error)
    throw new Error('Failed to generate QR code image')
  }
}

/**
 * Check if the QR code text looks like a WhatsApp Web QR code
 */
export function isWhatsAppQRCode(text: string): boolean {
  // WhatsApp QR codes typically contain specific patterns
  return text.includes('@') && text.includes(',') && text.length > 50
}
