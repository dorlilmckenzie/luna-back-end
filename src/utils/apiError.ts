/**
 * Application-level error with an HTTP status and a stable machine-readable code.
 * Controllers throw these; the error middleware turns them into the standard error envelope.
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown[];

  constructor(statusCode: number, code: string, message: string, details?: unknown[]) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace?.(this, ApiError);
  }

  static badRequest(message = 'Invalid request', details?: unknown[]) {
    return new ApiError(400, 'BAD_REQUEST', message, details);
  }

  static validation(message = 'Validation failed', details?: unknown[]) {
    return new ApiError(422, 'VALIDATION_ERROR', message, details);
  }

  static unauthorized(message = 'Authentication required') {
    return new ApiError(401, 'UNAUTHORIZED', message);
  }

  static forbidden(message = 'You do not have access to this resource') {
    return new ApiError(403, 'FORBIDDEN', message);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, 'NOT_FOUND', message);
  }

  static conflict(message = 'Resource already exists') {
    return new ApiError(409, 'CONFLICT', message);
  }

  static tooManyRequests(message = 'Too many requests, please try again later') {
    return new ApiError(429, 'RATE_LIMITED', message);
  }

  static internal(message = 'Something went wrong. Please try again.') {
    return new ApiError(500, 'INTERNAL_ERROR', message);
  }
}
