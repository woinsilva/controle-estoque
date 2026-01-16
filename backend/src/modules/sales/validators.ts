import { z } from 'zod';

export const saleSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1)
      })
    )
    .min(1)
});
