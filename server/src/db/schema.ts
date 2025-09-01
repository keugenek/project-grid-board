import { serial, text, pgTable, timestamp, integer, real, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enum for board item types
export const boardItemTypeEnum = pgEnum('board_item_type', ['task', 'status', 'note', 'image', 'diagram']);

// Boards table - represents the infinite canvas boards
export const boardsTable = pgTable('boards', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Board items table - represents items placed on the canvas
export const boardItemsTable = pgTable('board_items', {
  id: serial('id').primaryKey(),
  board_id: integer('board_id').notNull().references(() => boardsTable.id, { onDelete: 'cascade' }),
  type: boardItemTypeEnum('type').notNull(),
  title: text('title').notNull(),
  content: text('content'), // Nullable - can store JSON, XML, or plain text
  position_x: real('position_x').notNull(), // Use real for floating point coordinates
  position_y: real('position_y').notNull(),
  position_z: integer('position_z').notNull().default(0), // Z-index for layering
  width: real('width').notNull(), // Floating point dimensions
  height: real('height').notNull(),
  style_properties: text('style_properties'), // JSON string for CSS-like styling
  metadata: text('metadata'), // Additional metadata as JSON string
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Define relations between tables
export const boardsRelations = relations(boardsTable, ({ many }) => ({
  items: many(boardItemsTable)
}));

export const boardItemsRelations = relations(boardItemsTable, ({ one }) => ({
  board: one(boardsTable, {
    fields: [boardItemsTable.board_id],
    references: [boardsTable.id]
  })
}));

// TypeScript types for the table schemas
export type Board = typeof boardsTable.$inferSelect;
export type NewBoard = typeof boardsTable.$inferInsert;
export type BoardItem = typeof boardItemsTable.$inferSelect;
export type NewBoardItem = typeof boardItemsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = { 
  boards: boardsTable, 
  boardItems: boardItemsTable 
};

export const tableRelations = {
  boardsRelations,
  boardItemsRelations
};