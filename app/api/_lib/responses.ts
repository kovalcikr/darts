import { NextResponse } from 'next/server'

type ApiErrorOptions = {
  details?: unknown
  status: number
}

export function apiError(code: string, message: string, options: ApiErrorOptions) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        ...(options.details === undefined ? {} : { details: options.details }),
      },
    },
    { status: options.status }
  )
}

