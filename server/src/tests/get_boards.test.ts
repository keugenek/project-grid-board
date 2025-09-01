import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { boardsTable } from '../db/schema';
import { type CreateBoardInput } from '../schema';
import { getBoards } from '../handlers/get_boards';

// Simple test input for creating boards
const testBoard1: CreateBoardInput = {
  name: 'Test Board 1',
  description: 'First test board'
};

const testBoard2: CreateBoardInput = {
  name: 'Test Board 2', 
  description: null
};

describe('getBoards', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no boards exist', async () => {
    const result = await getBoards();

    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all boards when they exist', async () => {
    // Create test boards directly in database
    await db.insert(boardsTable)
      .values([
        {
          name: testBoard1.name,
          description: testBoard1.description
        },
        {
          name: testBoard2.name,
          description: testBoard2.description
        }
      ])
      .execute();

    const result = await getBoards();

    expect(result).toHaveLength(2);
    
    // Verify board structure and content
    const board1 = result.find(b => b.name === 'Test Board 1');
    const board2 = result.find(b => b.name === 'Test Board 2');

    expect(board1).toBeDefined();
    expect(board1?.name).toEqual('Test Board 1');
    expect(board1?.description).toEqual('First test board');
    expect(board1?.id).toBeDefined();
    expect(board1?.created_at).toBeInstanceOf(Date);
    expect(board1?.updated_at).toBeInstanceOf(Date);

    expect(board2).toBeDefined();
    expect(board2?.name).toEqual('Test Board 2');
    expect(board2?.description).toBeNull();
    expect(board2?.id).toBeDefined();
    expect(board2?.created_at).toBeInstanceOf(Date);
    expect(board2?.updated_at).toBeInstanceOf(Date);
  });

  it('should return boards ordered by updated_at descending', async () => {
    // Create first board
    const firstBoard = await db.insert(boardsTable)
      .values({
        name: 'First Board',
        description: 'Created first'
      })
      .returning()
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    // Create second board (will have later updated_at)
    const secondBoard = await db.insert(boardsTable)
      .values({
        name: 'Second Board',
        description: 'Created second'
      })
      .returning()
      .execute();

    const result = await getBoards();

    expect(result).toHaveLength(2);
    
    // Most recently updated should be first
    expect(result[0].name).toEqual('Second Board');
    expect(result[1].name).toEqual('First Board');
    
    // Verify timestamps are correctly ordered (descending)
    expect(result[0].updated_at >= result[1].updated_at).toBe(true);
  });

  it('should handle boards with null descriptions correctly', async () => {
    // Create board with null description
    await db.insert(boardsTable)
      .values({
        name: 'Board with null desc',
        description: null
      })
      .execute();

    const result = await getBoards();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Board with null desc');
    expect(result[0].description).toBeNull();
  });

  it('should return correct data types for all fields', async () => {
    await db.insert(boardsTable)
      .values({
        name: 'Type Test Board',
        description: 'Testing field types'
      })
      .execute();

    const result = await getBoards();

    expect(result).toHaveLength(1);
    const board = result[0];

    // Verify all field types
    expect(typeof board.id).toBe('number');
    expect(typeof board.name).toBe('string');
    expect(typeof board.description).toBe('string');
    expect(board.created_at).toBeInstanceOf(Date);
    expect(board.updated_at).toBeInstanceOf(Date);
  });
});