import { NextResponse } from 'next/server'

// CORS configuration
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400' // 24 hours
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
