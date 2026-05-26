import z from 'zod';

export const joinRoomSchema = z.object({
  code: z.string().min(1),
});

export const moveSchema = z.object({
  index: z.number().int().min(0).max(8),
});
