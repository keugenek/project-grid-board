import { serial, text, pgTable, timestamp, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const itemsTable = pgTable('items', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  status: text('status').notNull(),
  xmlContent: text('xml_content').notNull(), // Large text field for XML descriptions
  itemType: text('item_type').notNull(), // Categorization field
  parentItemId: integer('parent_item_id'), // Nullable by default for hierarchical relationships
  imageRef: text('image_ref'), // Nullable by default for optional image references
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Define relations for hierarchical structure
export const itemsRelations = relations(itemsTable, ({ one, many }) => ({
  parent: one(itemsTable, {
    fields: [itemsTable.parentItemId],
    references: [itemsTable.id],
    relationName: 'parent_child'
  }),
  children: many(itemsTable, {
    relationName: 'parent_child'
  }),
}));

// TypeScript types for the table schema
export type Item = typeof itemsTable.$inferSelect; // For SELECT operations
export type NewItem = typeof itemsTable.$inferInsert; // For INSERT operations

// Important: Export all tables for proper query building
export const tables = { items: itemsTable };