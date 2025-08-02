import { NextResponse } from 'next/server'

// CORS configuration for external API access
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, HEAD',
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, X-Forwarded-For',
  'Access-Control-Expose-Headers': 'Content-Length, X-JSON',
  'Access-Control-Max-Age': '86400', // 24 hours
  'Access-Control-Allow-Credentials': 'true'
}

// Specific headers for health check proxy
export const healthProxyHeaders = {
  ...corsHeaders,
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  Pragma: 'no-cache',
  Expires: '0'
}

// Helper function to create response with CORS headers
export function createCorsResponse(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      ...corsHeaders,
      ...init?.headers
    }
  })
}

// Helper function for health check responses
export function createHealthResponse(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      ...healthProxyHeaders,
      ...init?.headers
    }
  })
}

// Helper function for OPTIONS preflight requests
export function handleOptionsRequest() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders
  })
}

// Helper function for error responses with CORS
export function createCorsErrorResponse(
  error: { error: string; details?: string; code?: string },
  status: number
) {
  return NextResponse.json(error, {
    status,
    headers: corsHeaders
  })
}
