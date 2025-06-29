import rateLimit from 'express-rate-limit';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Zu viele Anfragen von dieser IP-Adresse',
    resetTime: '15 Minuten'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator: (req) => {
    // Sicherer Fallback
    return req.ip || req.socket?.remoteAddress || 'unknown';
  },
  // Skip wenn keine gültige Request
  skip: (req) => !req || !req.ip
});

// Strict limiter for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per windowMs
  message: {
    error: 'Zu viele Login-Versuche von dieser IP-Adresse',
    resetTime: '15 Minuten',
    hint: 'Bitte warten Sie 15 Minuten bevor Sie es erneut versuchen'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || req.socket?.remoteAddress || 'unknown';
  },
  skipSuccessfulRequests: true,
  skip: (req) => !req || !req.ip
});

// Moderate limiter for data creation
export const createLimiter = (max: number, windowMs: number) => rateLimit({
  windowMs: windowMs * 60 * 1000, // Convert minutes to milliseconds
  max: max,
  message: {
    error: 'Zu viele Anfragen',
    resetTime: `${windowMs} Minuten`
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || req.socket?.remoteAddress || 'unknown';
  },
  skip: (req) => !req || !req.ip
});
