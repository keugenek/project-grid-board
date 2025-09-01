import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { boardsTable } from '../db/schema';
import { type CreateBoardInput } from '../schema';
import { createBoard } from '../handlers/create_board';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateBoardInput = {
  name: 'Test Board',
  description: 'A board for testing'
};

describe('createBoard', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a board with name and description', async () => {
    const result = await createBoard(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Board');
    expect(result.description).toEqual('A board for testing');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a board with null description', async () => {
    const inputWithNullDescription: CreateBoardInput = {
      name: 'Board without description',
      description: null
    };

    const result = await createBoard(inputWithNullDescription);

    expect(result.name).toEqual('Board without description');
    expect(result.description).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save board to database', async () => {
    const result = await createBoard(testInput);

    // Query using proper drizzle syntax
    const boards = await db.select()
      .from(boardsTable)
      .where(eq(boardsTable.id, result.id))
      .execute();

    expect(boards).toHaveLength(1);
    expect(boards[0].name).toEqual('Test Board');
    expect(boards[0].description).toEqual('A board for testing');
    expect(boards[0].created_at).toBeInstanceOf(Date);
    expect(boards[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create multiple boards with unique IDs', async () => {
    const firstBoard = await createBoard({
      name: 'First Board',
      description: 'First test board'
    });

    const secondBoard = await createBoard({
      name: 'Second Board', 
      description: 'Second test board'
    });

    expect(firstBoard.id).not.toEqual(secondBoard.id);
    expect(firstBoard.name).toEqual('First Board');
    expect(secondBoard.name).toEqual('Second Board');

    // Verify both boards exist in database
    const allBoards = await db.select().from(boardsTable).execute();
    expect(allBoards).toHaveLength(2);
  });

  it('should handle boards with long names and descriptions', async () => {
    const longInput: CreateBoardInput = {
      name: 'A'.repeat(100),
      description: 'B'.repeat(500)
    };

    const result = await createBoard(longInput);

    expect(result.name).toEqual('A'.repeat(100));
    expect(result.description).toEqual('B'.repeat(500));
    expect(result.id).toBeDefined();
  });

  it('should set created_at and updated_at timestamps', async () => {
    const beforeCreation = new Date();
    
    const result = await createBoard(testInput);
    
    const afterCreation = new Date();

    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
  });
});