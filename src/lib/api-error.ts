export class ApiError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(
    code: string,
    message: string,
    statusCode: number = 500,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;

    // Maintains proper stack trace in V8 environments
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  static badRequest(message: string, details?: Record<string, unknown>): ApiError {
    return new ApiError('BAD_REQUEST', message, 400, details);
  }

  static unauthorized(message: string = 'Unauthorized'): ApiError {
    return new ApiError('UNAUTHORIZED', message, 401);
  }

  static forbidden(message: string = 'Forbidden'): ApiError {
    return new ApiError('FORBIDDEN', message, 403);
  }

  static notFound(message: string = 'Not found'): ApiError {
    return new ApiError('NOT_FOUND', message, 404);
  }

  static conflict(message: string, details?: Record<string, unknown>): ApiError {
    return new ApiError('CONFLICT', message, 409, details);
  }

  static tooManyRequests(message: string = 'Too many requests', retryAfter?: number): ApiError {
    return new ApiError('TOO_MANY_REQUESTS', message, 429, { retryAfter });
  }

  static internal(
    message: string = 'Internal server error',
    details?: Record<string, unknown>
  ): ApiError {
    return new ApiError('INTERNAL_ERROR', message, 500, details);
  }

  static serviceUnavailable(
    message: string = 'Service unavailable',
    details?: Record<string, unknown>
  ): ApiError {
    return new ApiError('SERVICE_UNAVAILABLE', message, 503, details);
  }

  toResponse(): { error: { code: string; message: string; details?: Record<string, unknown> } } {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details && { details: this.details }),
      },
    };
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function handleApiError(error: unknown): {
  error: { code: string; message: string; details?: Record<string, unknown> };
  status: number;
} {
  if (isApiError(error)) {
    return { ...error.toResponse(), status: error.statusCode };
  }

  if (error instanceof Error) {
    // Handle known error types
    if (error.name === 'ZodError') {
      return {
        ...ApiError.badRequest('Validation failed', { issues: (error as any).issues }).toResponse(),
        status: 400,
      };
    }
    if (error.name === 'PrismaClientKnownRequestError') {
      return { ...ApiError.conflict('Database constraint violation').toResponse(), status: 409 };
    }
  }

  console.error('Unhandled error:', error);
  return { ...ApiError.internal().toResponse(), status: 500 };
}
