import rateLimit from 'express-rate-limit';

export const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: { error: 'Too many requests. Slow down.' },
    standardHeaders: true,
    legacyHeaders: false,
});
