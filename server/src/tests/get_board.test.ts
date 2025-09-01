import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { boardsTable } from '../db/schema';
import { type GetBoardInput, type CreateBoardInput } from '../schema';
import { getBoard } from '../handlers/get_board';
import { eq } from 'drizzle-orm';

// Simple test input
const testBoardInput: CreateBoardInput = {
  name: 'Test Board',
  description: 'A board for testing'
};

const testBoardInputWithNullDescription: CreateBoardInput = {
  name: 'Board Without Description',
  description: null
};

describe('getBoard', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a board when it exists', async () => {
    // Create a test board first
    const createdBoards = await db.insert(boardsTable)
      .values(testBoardInput)
      .returning()
      .execute();

    const createdBoard = createdBoards[0];

    // Test getting the board
    const input: GetBoardInput = { id: createdBoard.id };
    const result = await getBoard(input);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdBoard.id);
    expect(result!.name).toEqual('Test Board');
    expect(result!.description).toEqual('A board for testing');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when board does not exist', async () => {
    // Test with a non-existent board ID
    const input: GetBoardInput = { id: 999 };
    const result = await getBoard(input);

    // Verify null is returned
    expect(result).toBeNull();
  });

  it('should handle boards with null description', async () => {
    // Create a test board with null description
    const createdBoards = await db.insert(boardsTable)
      .values(testBoardInputWithNullDescription)
      .returning()
      .execute();

    const createdBoard = createdBoards[0];

    // Test getting the board
    const input: GetBoardInput = { id: createdBoard.id };
    const result = await getBoard(input);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdBoard.id);
    expect(result!.name).toEqual('Board Without Description');
    expect(result!.description).toBeNull();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should verify board is saved correctly in database', async () => {
    // Create a test board
    const createdBoards = await db.insert(boardsTable)
      .values(testBoardInput)
      .returning()
      .execute();

    const createdBoard = createdBoards[0];

    // Get the board using the handler
    const input: GetBoardInput = { id: createdBoard.id };
    const result = await getBoard(input);

    // Verify database consistency by querying directly
    const directQuery = await db.select()
      .from(boardsTable)
      .where(eq(boardsTable.id, createdBoard.id))
      .execute();

    expect(directQuery).toHaveLength(1);
    expect(directQuery[0].name).toEqual(result!.name);
    expect(directQuery[0].description).toEqual(result!.description);
    expect(directQuery[0].created_at).toEqual(result!.created_at);
    expect(directQuery[0].updated_at).toEqual(result!.updated_at);
  });

  it('should handle multiple boards correctly', async () => {
    // Create multiple test boards
    const board1Input: CreateBoardInput = {
      name: 'First Board',
      description: 'First description'
    };

    const board2Input: CreateBoardInput = {
      name: 'Second Board',
      description: 'Second description'
    };

    const createdBoard1 = await db.insert(boardsTable)
      .values(board1Input)
      .returning()
      .execute();

    const createdBoard2 = await db.insert(boardsTable)
      .values(board2Input)
      .returning()
      .execute();

    // Test getting the first board
    const result1 = await getBoard({ id: createdBoard1[0].id });
    expect(result1).not.toBeNull();
    expect(result1!.name).toEqual('First Board');
    expect(result1!.description).toEqual('First description');

    // Test getting the second board
    const result2 = await getBoard({ id: createdBoard2[0].id });
    expect(result2).not.toBeNull();
    expect(result2!.name).toEqual('Second Board');
    expect(result2!.description).toEqual('Second description');

    // Verify they are different boards
    expect(result1!.id).not.toEqual(result2!.id);
  });
});