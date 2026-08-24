import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-error';

export async function errorHandler(
  request: NextRequest,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    return await handler();
  } catch (error) {
    const { error: errorResponse, status } = handleApiError(error);
    return NextResponse.json(errorResponse, { status });
  }
}
