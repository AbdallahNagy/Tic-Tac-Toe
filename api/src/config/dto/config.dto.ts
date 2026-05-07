import { z } from 'zod';

const redisSchema = z.object({
  host: z.string().min(1),
  port: z.coerce.number().int().positive().max(65535).default(6379),
  password: z.string().min(1),
});

export const configSchema = z.object({
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  port: z.coerce.number().int().positive().max(65535).default(3000),
  clientURL: z
    .string()
    .refine((val) => val.length > 0, { message: 'ORIGINS cannot be empty' })
    .transform((val) => val.split(',')),
  redis: redisSchema,
});
