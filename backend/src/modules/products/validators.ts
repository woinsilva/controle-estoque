import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  price: z.number().min(0),
  stockQty: z.number().min(0),
  active: z.boolean().optional().default(true)
});
