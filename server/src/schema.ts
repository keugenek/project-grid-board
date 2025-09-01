import { z } from 'zod';

// Item schema with proper validation
export const itemSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  status: z.string(),
  xmlContent: z.string(),
  itemType: z.string(),
  parentItemId: z.number().nullable(), // Can be null for root items
  imageRef: z.string().nullable(), // Optional image reference
  created_at: z.coerce.date(), // Automatically converts string timestamps to Date objects
  updated_at: z.coerce.date()
});

export type Item = z.infer<typeof itemSchema>;

// Input schema for creating items
export const createItemInputSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string(),
  status: z.string().min(1, "Status is required"),
  xmlContent: z.string(),
  itemType: z.string().min(1, "Item type is required"),
  parentItemId: z.number().nullable(), // Explicit null allowed for root items
  imageRef: z.string().nullable() // Explicit null allowed for items without images
});

export type CreateItemInput = z.infer<typeof createItemInputSchema>;

// Input schema for updating items
export const updateItemInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional(),
  status: z.string().min(1, "Status is required").optional(),
  xmlContent: z.string().optional(),
  itemType: z.string().min(1, "Item type is required").optional(),
  parentItemId: z.number().nullable().optional(), // Can be null, undefined, or a number
  imageRef: z.string().nullable().optional() // Can be null, undefined, or a string
});

export type UpdateItemInput = z.infer<typeof updateItemInputSchema>;

// Input schema for querying items by parent
export const getItemsByParentInputSchema = z.object({
  parentItemId: z.number().nullable() // null for root items, number for child items
});

export type GetItemsByParentInput = z.infer<typeof getItemsByParentInputSchema>;

// Input schema for querying items by type
export const getItemsByTypeInputSchema = z.object({
  itemType: z.string().min(1, "Item type is required")
});

export type GetItemsByTypeInput = z.infer<typeof getItemsByTypeInputSchema>;

// Input schema for deleting items
export const deleteItemInputSchema = z.object({
  id: z.number()
});

export type DeleteItemInput = z.infer<typeof deleteItemInputSchema>;