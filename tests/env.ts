// Loaded before any application module. Provides a valid test configuration so
// src/config/env.ts does not exit the process.
process.env.NODE_ENV = 'test';
process.env.PORT = '5099';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/period_tracker_test?schema=public';
process.env.JWT_SECRET = 'test-access-secret-value';
process.env.JWT_EXPIRES_IN = '15m';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret-value';
process.env.REFRESH_TOKEN_EXPIRES_IN = '7d';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.COOKIE_SECURE = 'false';
process.env.RESET_TOKEN_EXPIRES_IN_MINUTES = '30';
