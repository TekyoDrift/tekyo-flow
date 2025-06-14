// JWT secret - in production, use environment variable
export const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
export const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS || '10', 10);
