import { z } from 'zod';

// Board schema - represents the infinite canvas
export const boardSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Board = z.infer<typeof boardSchema>;

// Board item types enum
export const boardItemTypeSchema = z.enum(['task', 'status', 'note', 'image', 'diagram']);
export type BoardItemType = z.infer<typeof boardItemTypeSchema>;

// Position schema for grid coordinates
export const positionSchema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number().int().default(0) // Z-index for layering
});

export type Position = z.infer<typeof positionSchema>;

// Dimensions schema for item sizing
export const dimensionsSchema = z.object({
  width: z.number().positive(),
  height: z.number().positive()
});

export type Dimensions = z.infer<typeof dimensionsSchema>;

// Board item schema - represents any item on the canvas
export const boardItemSchema = z.object({
  id: z.number(),
  board_id: z.number(),
  type: boardItemTypeSchema,
  title: z.string(),
  content: z.string().nullable(), // JSON or XML content based on type
  position_x: z.number(),
  position_y: z.number(),
  position_z: z.number().int(),
  width: z.number().positive(),
  height: z.number().positive(),
  style_properties: z.string().nullable(), // JSON string for styling
  metadata: z.string().nullable(), // Additional metadata as JSON
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type BoardItem = z.infer<typeof boardItemSchema>;

// XML diagram schema - for parsing and validating diagram XML content
export const xmlDiagramSchema = z.object({
  xml_content: z.string(),
  compositions: z.array(z.string()).optional(), // Embedded compositions
  diagram_type: z.string().optional()
});

export type XmlDiagram = z.infer<typeof xmlDiagramSchema>;

// Input schemas for creating entities

export const createBoardInputSchema = z.object({
  name: z.string().min(1, "Board name is required"),
  description: z.string().nullable().optional()
});

export type CreateBoardInput = z.infer<typeof createBoardInputSchema>;

export const createBoardItemInputSchema = z.object({
  board_id: z.number().positive(),
  type: boardItemTypeSchema,
  title: z.string().min(1, "Title is required"),
  content: z.string().nullable().optional(),
  position: positionSchema,
  dimensions: dimensionsSchema,
  style_properties: z.record(z.any()).optional(), // Will be serialized to JSON
  metadata: z.record(z.any()).optional() // Will be serialized to JSON
});

export type CreateBoardItemInput = z.infer<typeof createBoardItemInputSchema>;

// Update schemas

export const updateBoardInputSchema = z.object({
  id: z.number().positive(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional()
});

export type UpdateBoardInput = z.infer<typeof updateBoardInputSchema>;

export const updateBoardItemInputSchema = z.object({
  id: z.number().positive(),
  title: z.string().min(1).optional(),
  content: z.string().nullable().optional(),
  position: positionSchema.optional(),
  dimensions: dimensionsSchema.optional(),
  style_properties: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional()
});

export type UpdateBoardItemInput = z.infer<typeof updateBoardItemInputSchema>;

// Query schemas

export const getBoardItemsInputSchema = z.object({
  board_id: z.number().positive(),
  type: boardItemTypeSchema.optional(),
  bounds: z.object({
    min_x: z.number(),
    max_x: z.number(),
    min_y: z.number(),
    max_y: z.number()
  }).optional() // For viewport-based querying
});

export type GetBoardItemsInput = z.infer<typeof getBoardItemsInputSchema>;

export const createXmlDiagramInputSchema = z.object({
  board_id: z.number().positive(),
  title: z.string().min(1, "Diagram title is required"),
  xml_content: z.string().min(1, "XML content is required"),
  position: positionSchema,
  dimensions: dimensionsSchema,
  diagram_type: z.string().optional(),
  style_properties: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional()
});

export type CreateXmlDiagramInput = z.infer<typeof createXmlDiagramInputSchema>;

export const updateXmlDiagramInputSchema = z.object({
  id: z.number().positive(),
  title: z.string().min(1).optional(),
  xml_content: z.string().min(1).optional(),
  position: positionSchema.optional(),
  dimensions: dimensionsSchema.optional(),
  diagram_type: z.string().optional(),
  style_properties: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional()
});

export type UpdateXmlDiagramInput = z.infer<typeof updateXmlDiagramInputSchema>;