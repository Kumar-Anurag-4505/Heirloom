import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as crypto from 'crypto';

export const validateRequest = (schema: z.ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const zodError = error as z.ZodError;
        const formattedErrors = zodError.errors.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message
        }));

        res.status(400).json({
          success: false,
          message: 'Validation failed',
          data: null,
          errors: formattedErrors,
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID()
        });
        return;
      }
      next(error);
    }
  };
};
