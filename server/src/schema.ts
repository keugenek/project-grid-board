import { z } from 'zod';

// Item status enum
export const itemStatusSchema = z.enum(['todo', 'in_progress', 'review', 'done', 'archived']);
export type ItemStatus = z.infer<typeof itemStatusSchema>;

// Board schema
export const boardSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Board = z.infer<typeof boardSchema>;

// Item schema with position for canvas layout
export const itemSchema = z.object({
  id: z.number(),
  board_id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  status: itemStatusSchema,
  xml_content: z.string().nullable(), // XML content for AI processing
  position_x: z.number(), // X coordinate on canvas
  position_y: z.number(), // Y coordinate on canvas
  width: z.number(), // Width for canvas layout
  height: z.number(), // Height for canvas layout
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Item = z.infer<typeof itemSchema>;

// Input schema for creating boards
export const createBoardInputSchema = z.object({
  name: z.string().min(1, "Board name is required"),
  description: z.string().nullable()
});

export type CreateBoardInput = z.infer<typeof createBoardInputSchema>;

// Input schema for updating boards
export const updateBoardInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1, "Board name is required").optional(),
  description: z.string().nullable().optional()
});

export type UpdateBoardInput = z.infer<typeof updateBoardInputSchema>;

// Input schema for creating items
export const createItemInputSchema = z.object({
  board_id: z.number(),
  title: z.string().min(1, "Item title is required"),
  description: z.string().nullable(),
  status: itemStatusSchema.default('todo'),
  xml_content: z.string().nullable(),
  position_x: z.number().default(0),
  position_y: z.number().default(0),
  width: z.number().positive().default(200),
  height: z.number().positive().default(150)
});

export type CreateItemInput = z.infer<typeof createItemInputSchema>;

// Input schema for updating items
export const updateItemInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1, "Item title is required").optional(),
  description: z.string().nullable().optional(),
  status: itemStatusSchema.optional(),
  xml_content: z.string().nullable().optional(),
  position_x: z.number().optional(),
  position_y: z.number().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional()
});

export type UpdateItemInput = z.infer<typeof updateItemInputSchema>;

// Input schema for updating item position (for drag & drop)
export const updateItemPositionInputSchema = z.object({
  id: z.number(),
  position_x: z.number(),
  position_y: z.number()
});

export type UpdateItemPositionInput = z.infer<typeof updateItemPositionInputSchema>;

// Query schema for getting items by board
export const getItemsByBoardInputSchema = z.object({
  board_id: z.number()
});

export type GetItemsByBoardInput = z.infer<typeof getItemsByBoardInputSchema>;

// Query schema for getting single item
export const getItemInputSchema = z.object({
  id: z.number()
});

export type GetItemInput = z.infer<typeof getItemInputSchema>;

// Query schema for getting single board
export const getBoardInputSchema = z.object({
  id: z.number()
});

export type GetBoardInput = z.infer<typeof getBoardInputSchema>;