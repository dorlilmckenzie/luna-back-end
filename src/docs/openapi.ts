import { env } from '../config/env';

/**
 * Hand-written OpenAPI 3.0 document. Served at /api/docs (Swagger UI) and /api/docs.json.
 * Kept intentionally small but covers auth, request bodies, responses and error shapes.
 */
export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Period Tracker API',
    version: '1.0.0',
    description:
      'REST API for the Period Tracker application. All responses use the envelope ' +
      '`{ success, data, message }` or `{ success: false, error: { code, message, details } }`. ' +
      'Predictions are estimates only and are not medical advice.',
  },
  servers: [{ url: `http://localhost:${env.PORT}/api`, description: 'Local development' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'VALIDATION_ERROR' },
              message: { type: 'string' },
              details: { type: 'array', items: { type: 'object' } },
            },
          },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              accessToken: { type: 'string' },
              user: { $ref: '#/components/schemas/User' },
            },
          },
          message: { type: 'string' },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          email: { type: 'string', format: 'email' },
          dateOfBirth: { type: 'string', format: 'date-time' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Period: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time', nullable: true },
          flow: { type: 'string', enum: ['LIGHT', 'MEDIUM', 'HEAVY', 'VERY_HEAVY'] },
          notes: { type: 'string', nullable: true },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/health': {
      get: { summary: 'Health check', security: [], responses: { 200: { description: 'OK' } } },
    },
    '/auth/register': {
      post: {
        summary: 'Register a new account and receive an access token (refresh token set as httpOnly cookie)',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['firstName', 'lastName', 'email', 'password', 'confirmPassword', 'dateOfBirth'],
                properties: {
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                  confirmPassword: { type: 'string' },
                  dateOfBirth: { type: 'string', format: 'date', example: '1998-04-12' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Created', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
          409: { description: 'Email already in use', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          422: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Log in with email and password',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
          401: { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/auth/refresh': {
      post: { summary: 'Exchange the refresh-token cookie for a new access token', security: [], responses: { 200: { description: 'OK' }, 401: { description: 'Expired session' } } },
    },
    '/auth/logout': {
      post: { summary: 'Revoke the current refresh session', security: [], responses: { 200: { description: 'OK' } } },
    },
    '/auth/forgot-password': {
      post: {
        summary: 'Request a password reset link (token is logged to the backend console in development)',
        security: [],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['email'], properties: { email: { type: 'string', format: 'email' } } } } } },
        responses: { 200: { description: 'Always returns 200 to avoid user enumeration' } },
      },
    },
    '/auth/reset-password': {
      post: {
        summary: 'Reset the password using a reset token',
        security: [],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['token', 'password'], properties: { token: { type: 'string' }, password: { type: 'string', minLength: 8 } } } } } },
        responses: { 200: { description: 'OK' }, 400: { description: 'Invalid or expired token' } },
      },
    },
    '/auth/me': {
      get: { summary: 'Get the authenticated user', responses: { 200: { description: 'OK' }, 401: { description: 'Unauthorized' } } },
    },
    '/users/me': {
      get: { summary: 'Get profile', responses: { 200: { description: 'OK' } } },
      patch: {
        summary: 'Update firstName / lastName / email',
        requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { firstName: { type: 'string' }, lastName: { type: 'string' }, email: { type: 'string', format: 'email' } } } } } },
        responses: { 200: { description: 'OK' }, 409: { description: 'Email in use' } },
      },
      delete: {
        summary: 'Permanently delete the account and all associated data',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['password'], properties: { password: { type: 'string' } } } } } },
        responses: { 200: { description: 'Deleted' }, 400: { description: 'Wrong password' } },
      },
    },
    '/users/me/password': {
      patch: {
        summary: 'Change password (revokes other sessions)',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['currentPassword', 'newPassword'], properties: { currentPassword: { type: 'string' }, newPassword: { type: 'string', minLength: 8 } } } } } },
        responses: { 200: { description: 'OK' }, 400: { description: 'Wrong current password' } },
      },
    },
    '/periods': {
      get: {
        summary: 'List the authenticated user\'s periods',
        parameters: [
          { name: 'from', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'to', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
        ],
        responses: { 200: { description: 'OK' } },
      },
      post: {
        summary: 'Log a period',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Period' } } } },
        responses: { 201: { description: 'Created' }, 409: { description: 'Duplicate start date' }, 422: { description: 'Validation error' } },
      },
    },
    '/periods/{id}': {
      get: { summary: 'Get one period (404 if not owned by the caller)', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'OK' }, 404: { description: 'Not found' } } },
      patch: { summary: 'Update a period', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'OK' }, 404: { description: 'Not found' } } },
      delete: { summary: 'Delete a period', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'Deleted' }, 404: { description: 'Not found' } } },
    },
    '/symptoms': {
      get: { summary: 'List symptom logs', responses: { 200: { description: 'OK' } } },
      post: {
        summary: 'Log one or more symptoms for a date',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['date', 'types'], properties: { date: { type: 'string', format: 'date' }, types: { type: 'array', items: { type: 'string' } }, severity: { type: 'string', enum: ['MILD', 'MODERATE', 'SEVERE'] }, notes: { type: 'string' } } } } } },
        responses: { 201: { description: 'Created' } },
      },
    },
    '/symptoms/{id}': {
      patch: { summary: 'Update a symptom log', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'OK' }, 404: { description: 'Not found' } } },
      delete: { summary: 'Delete a symptom log', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Deleted' } } },
    },
    '/moods': {
      get: { summary: 'List mood logs', responses: { 200: { description: 'OK' } } },
      post: { summary: 'Log a mood', responses: { 201: { description: 'Created' } } },
    },
    '/moods/{id}': {
      patch: { summary: 'Update a mood log', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'OK' } } },
      delete: { summary: 'Delete a mood log', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Deleted' } } },
    },
    '/cycles': {
      get: { summary: 'Cycle history derived from period logs', responses: { 200: { description: 'OK' } } },
    },
    '/cycles/statistics': {
      get: { summary: 'Aggregate cycle statistics', responses: { 200: { description: 'OK' } } },
    },
    '/cycles/summary': {
      get: { summary: 'Dashboard summary (current cycle + statistics)', responses: { 200: { description: 'OK' } } },
    },
    '/predictions': {
      get: { summary: 'Full prediction payload (next period, ovulation, fertile window, confidence)', responses: { 200: { description: 'OK' } } },
    },
    '/predictions/next-period': {
      get: { summary: 'Predicted next period only', responses: { 200: { description: 'OK' } } },
    },
    '/predictions/fertile-window': {
      get: { summary: 'Estimated fertile window and ovulation', responses: { 200: { description: 'OK' } } },
    },
    '/predictions/calendar': {
      get: {
        summary: 'Predicted period / fertile / ovulation days for a date range (calendar overlay)',
        parameters: [
          { name: 'from', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'to', in: 'query', schema: { type: 'string', format: 'date' } },
        ],
        responses: { 200: { description: 'OK' } },
      },
    },
    '/reminders': {
      get: { summary: 'Get reminder preferences', responses: { 200: { description: 'OK' } } },
      patch: {
        summary: 'Update reminder preferences',
        requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { periodReminder: { type: 'boolean' }, periodReminderDaysBefore: { type: 'integer' }, symptomReminder: { type: 'boolean' }, reminderTime: { type: 'string', example: '09:00' } } } } } },
        responses: { 200: { description: 'OK' } },
      },
    },
  },
} as const;
