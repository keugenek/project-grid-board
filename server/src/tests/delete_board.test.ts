import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { boardsTable, itemsTable } from '../db/schema';
import { type GetBoardInput, type CreateBoardInput } from '../schema';
import { deleteBoard } from '../handlers/delete_board';
import { eq } from 'drizzle-orm';

// Test data
const testBoardInput: CreateBoardInput = {
  name: 'Test Board',
  description: 'A board for testing'
};

const testItemData = {
  title: 'Test Item',
  description: 'A test item',
  status: 'todo' as const,
  xml_content: '<item>test</item>',
  position_x: 100,
  position_y: 200,
  width: 300,
  height: 150
};

describe('deleteBoard', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a board successfully', async () => {
    // Create a board first
    const boardResult = await db.insert(boardsTable)
      .values(testBoardInput)
      .returning()
      .execute();
    
    const boardId = boardResult[0].id;
    const deleteInput: GetBoardInput = { id: boardId };

    // Delete the board
    const result = await deleteBoard(deleteInput);

    // Verify success
    expect(result.success).toBe(true);

    // Verify board is actually deleted from database
    const boards = await db.select()
      .from(boardsTable)
      .where(eq(boardsTable.id, boardId))
      .execute();

    expect(boards).toHaveLength(0);
  });

  it('should cascade delete items when board is deleted', async () => {
    // Create a board first
    const boardResult = await db.insert(boardsTable)
      .values(testBoardInput)
      .returning()
      .execute();
    
    const boardId = boardResult[0].id;

    // Create items associated with the board
    await db.insert(itemsTable)
      .values([
        { board_id: boardId, ...testItemData },
        { board_id: boardId, ...testItemData, title: 'Test Item 2' }
      ])
      .execute();

    // Verify items exist before deletion
    const itemsBeforeDelete = await db.select()
      .from(itemsTable)
      .where(eq(itemsTable.board_id, boardId))
      .execute();

    expect(itemsBeforeDelete).toHaveLength(2);

    // Delete the board
    const deleteInput: GetBoardInput = { id: boardId };
    const result = await deleteBoard(deleteInput);

    expect(result.success).toBe(true);

    // Verify board is deleted
    const boards = await db.select()
      .from(boardsTable)
      .where(eq(boardsTable.id, boardId))
      .execute();

    expect(boards).toHaveLength(0);

    // Verify items are cascade deleted
    const itemsAfterDelete = await db.select()
      .from(itemsTable)
      .where(eq(itemsTable.board_id, boardId))
      .execute();

    expect(itemsAfterDelete).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent board', async () => {
    const nonExistentId = 99999;
    const deleteInput: GetBoardInput = { id: nonExistentId };

    const result = await deleteBoard(deleteInput);

    expect(result.success).toBe(false);
  });

  it('should handle multiple board deletions correctly', async () => {
    // Create multiple boards
    const board1Result = await db.insert(boardsTable)
      .values({ name: 'Board 1', description: 'First board' })
      .returning()
      .execute();
    
    const board2Result = await db.insert(boardsTable)
      .values({ name: 'Board 2', description: 'Second board' })
      .returning()
      .execute();

    const board1Id = board1Result[0].id;
    const board2Id = board2Result[0].id;

    // Delete first board
    const result1 = await deleteBoard({ id: board1Id });
    expect(result1.success).toBe(true);

    // Verify first board is deleted but second still exists
    const remainingBoards = await db.select()
      .from(boardsTable)
      .execute();

    expect(remainingBoards).toHaveLength(1);
    expect(remainingBoards[0].id).toBe(board2Id);

    // Delete second board
    const result2 = await deleteBoard({ id: board2Id });
    expect(result2.success).toBe(true);

    // Verify all boards are deleted
    const allBoards = await db.select()
      .from(boardsTable)
      .execute();

    expect(allBoards).toHaveLength(0);
  });
});