import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { boardsTable, itemsTable } from '../db/schema';
import { type GetItemInput } from '../schema';
import { deleteItem } from '../handlers/delete_item';
import { eq } from 'drizzle-orm';

// Test input with valid item ID
const testInput: GetItemInput = {
  id: 1
};

describe('deleteItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create test board
  const createTestBoard = async () => {
    const boardResult = await db.insert(boardsTable)
      .values({
        name: 'Test Board',
        description: 'A board for testing'
      })
      .returning()
      .execute();
    return boardResult[0];
  };

  // Helper function to create test item
  const createTestItem = async (boardId: number) => {
    const itemResult = await db.insert(itemsTable)
      .values({
        board_id: boardId,
        title: 'Test Item',
        description: 'An item for testing',
        status: 'todo',
        xml_content: '<test>content</test>',
        position_x: 100,
        position_y: 200,
        width: 250,
        height: 180
      })
      .returning()
      .execute();
    return itemResult[0];
  };

  it('should successfully delete an existing item', async () => {
    // Create test board and item
    const board = await createTestBoard();
    const item = await createTestItem(board.id);

    // Delete the item
    const result = await deleteItem({ id: item.id });

    // Should return success
    expect(result.success).toBe(true);

    // Verify item is deleted from database
    const deletedItems = await db.select()
      .from(itemsTable)
      .where(eq(itemsTable.id, item.id))
      .execute();

    expect(deletedItems).toHaveLength(0);
  });

  it('should return success false when item does not exist', async () => {
    // Try to delete non-existent item
    const result = await deleteItem({ id: 999 });

    // Should return success false since no rows were affected
    expect(result.success).toBe(false);
  });

  it('should not affect other items when deleting', async () => {
    // Create test board and multiple items
    const board = await createTestBoard();
    const item1 = await createTestItem(board.id);
    const item2 = await createTestItem(board.id);
    const item3 = await createTestItem(board.id);

    // Delete only one item
    const result = await deleteItem({ id: item2.id });

    // Should return success
    expect(result.success).toBe(true);

    // Verify only the target item is deleted
    const remainingItems = await db.select()
      .from(itemsTable)
      .where(eq(itemsTable.board_id, board.id))
      .execute();

    expect(remainingItems).toHaveLength(2);
    
    // Check that the remaining items are the correct ones
    const remainingIds = remainingItems.map(item => item.id).sort();
    expect(remainingIds).toEqual([item1.id, item3.id].sort());

    // Verify the deleted item is not in the remaining items
    expect(remainingItems.find(item => item.id === item2.id)).toBeUndefined();
  });

  it('should handle cascade deletion when board is deleted', async () => {
    // Create test board and item
    const board = await createTestBoard();
    const item = await createTestItem(board.id);

    // Delete the board (should cascade delete items)
    await db.delete(boardsTable)
      .where(eq(boardsTable.id, board.id))
      .execute();

    // Verify item is also deleted due to cascade
    const remainingItems = await db.select()
      .from(itemsTable)
      .where(eq(itemsTable.id, item.id))
      .execute();

    expect(remainingItems).toHaveLength(0);

    // Try to delete the already-deleted item
    const result = await deleteItem({ id: item.id });

    // Should return success false since item no longer exists
    expect(result.success).toBe(false);
  });

  it('should preserve database integrity after deletion', async () => {
    // Create test board with multiple items
    const board = await createTestBoard();
    const item1 = await createTestItem(board.id);
    const item2 = await createTestItem(board.id);

    // Delete one item
    await deleteItem({ id: item1.id });

    // Verify remaining item still references the board correctly
    const remainingItems = await db.select()
      .from(itemsTable)
      .where(eq(itemsTable.board_id, board.id))
      .execute();

    expect(remainingItems).toHaveLength(1);
    expect(remainingItems[0].id).toBe(item2.id);
    expect(remainingItems[0].board_id).toBe(board.id);
    expect(remainingItems[0].title).toBe('Test Item');

    // Verify board still exists
    const boards = await db.select()
      .from(boardsTable)
      .where(eq(boardsTable.id, board.id))
      .execute();

    expect(boards).toHaveLength(1);
    expect(boards[0].id).toBe(board.id);
  });
});