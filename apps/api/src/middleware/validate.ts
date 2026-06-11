import { Request, Response, NextFunction } from 'express';

const MAX_CODE_LENGTH = 10_000;
const MAX_LINE_LENGTH = 1000;

const CONTROL_CHARS_REGEX = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/;

export function validateCode(req: Request, res: Response, next: NextFunction) {
    const { code } = req.body;

    if (typeof code !== 'string') {
        res.status(400).json({ error: 'code must be a string' });
        return;
    }

    if (code.length > MAX_CODE_LENGTH) {
        res.status(400).json({ error: `code too large (max ${MAX_CODE_LENGTH} characters)` });
        return;
    }

    if (code.trim().length === 0) {
        res.status(400).json({ error: 'code is empty' });
        return;
    }

    if (CONTROL_CHARS_REGEX.test(code)) {
        res.status(400).json({ error: 'code contains suspicious or invalid characters' });
        return;
    }

    const hasTooLongLine = code.split(/\r?\n/).some(line => line.length > MAX_LINE_LENGTH);
    if (hasTooLongLine) {
        res.status(400).json({ error: `code contains a line exceeding the limit of ${MAX_LINE_LENGTH} characters` });
        return;
    }

    next();
}