import { ZodError, ZodType } from 'zod';
import { BadRequestException } from '@nestjs/common';

export function validateWithZod<T>(schema: ZodType<T>, value: unknown): T {
  try {
    return schema.parse(value);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new BadRequestException({
        errors: error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
        message: 'Validation failed',
        statusCode: 400,
      });
    }
    throw new BadRequestException('Validation failed');
  }
}
