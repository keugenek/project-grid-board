import { serial, text, pgTable, timestamp, integer, real, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Define the status enum for items
export const itemStatusEnum = pgEnum('item_status', ['todo', 'in_progress', 'review', 'done', 'archived']);

// Boards table - represents canvas boards
export const boardsTable = pgTable('boards', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Items table - represents items on the canvas board
export const itemsTable = pgTable('items', {
  id: serial('id').primaryKey(),
  board_id: integer('board_id').notNull().references(() => boardsTable.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'), // Nullable by default
  status: itemStatusEnum('status').notNull().default('todo'),
  xml_content: text('xml_content'), // XML content for AI processing, nullable
  position_x: real('position_x').notNull().default(0), // X coordinate on canvas
  position_y: real('position_y').notNull().default(0), // Y coordinate on canvas
  width: real('width').notNull().default(200), // Width for canvas layout
  height: real('height').notNull().default(150), // Height for canvas layout
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Define relations between boards and items
export const boardsRelations = relations(boardsTable, ({ many }) => ({
  items: many(itemsTable),
}));

export const itemsRelations = relations(itemsTable, ({ one }) => ({
  board: one(boardsTable, {
    fields: [itemsTable.board_id],
    references: [boardsTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Board = typeof boardsTable.$inferSelect; // For SELECT operations
export type NewBoard = typeof boardsTable.$inferInsert; // For INSERT operations

export type Item = typeof itemsTable.$inferSelect; // For SELECT operations
export type NewItem = typeof itemsTable.$inferInsert; // For INSERT operations

// Important: Export all tables and relations for proper query building
export const tables = { 
  boards: boardsTable, 
  items: itemsTable 
};

export const relations_exports = {
  boardsRelations,
  itemsRelations
};