import type { Request } from 'express';

export interface AuthTokenPayload {
  sub: string; // user id
  email: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthTokenPayload;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorShape {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown[];
  };
}

export type PublicUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  createdAt: string;
  updatedAt: string;
};
