import { z } from 'zod';
const objectIdRegex = /^[a-f\d]{24}$/i;

export const saleSchema = z.object({
  clientId: z.string().regex(objectIdRegex, 'Invalid client id.'),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1)
      })
    )
    .min(1)
});
