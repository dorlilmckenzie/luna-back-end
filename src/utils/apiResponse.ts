import type { Response } from 'express';
import type { ApiSuccess } from '../types';

export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200,
): Response<ApiSuccess<T>> {
  return res.status(statusCode).json({ success: true, data, message });
}

export function sendCreated<T>(res: Response, data: T, message = 'Created successfully') {
  return sendSuccess(res, data, message, 201);
}

export function sendNoContentJson(res: Response, message = 'Deleted successfully') {
  return res.status(200).json({ success: true, data: null, message });
}
