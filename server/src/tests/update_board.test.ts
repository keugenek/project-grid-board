import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { boardsTable } from '../db/schema';
import { type UpdateBoardInput, type CreateBoardInput } from '../schema';
import { updateBoard } from '../handlers/update_board';
import { eq } from 'drizzle-orm';

// Helper function to create a test board
const createTestBoard = async (boardData: CreateBoardInput) => {
  const result = await db.insert(boardsTable)
    .values({
      name: boardData.name,
      description: boardData.description
    })
    .returning()
    .execute();
  return result[0];
};

describe('updateBoard', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update board name only', async () => {
    // Create a test board first
    const testBoard = await createTestBoard({
      name: 'Original Board',
      description: 'Original description'
    });

    const updateInput: UpdateBoardInput = {
      id: testBoard.id,
      name: 'Updated Board Name'
    };

    const result = await updateBoard(updateInput);

    // Verify the updated fields
    expect(result.id).toEqual(testBoard.id);
    expect(result.name).toEqual('Updated Board Name');
    expect(result.description).toEqual('Original description'); // Should remain unchanged
    expect(result.created_at).toEqual(testBoard.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > testBoard.updated_at).toBe(true);
  });

  it('should update board description only', async () => {
    // Create a test board first
    const testBoard = await createTestBoard({
      name: 'Test Board',
      description: 'Original description'
    });

    const updateInput: UpdateBoardInput = {
      id: testBoard.id,
      description: 'Updated description'
    };

    const result = await updateBoard(updateInput);

    // Verify the updated fields
    expect(result.id).toEqual(testBoard.id);
    expect(result.name).toEqual('Test Board'); // Should remain unchanged
    expect(result.description).toEqual('Updated description');
    expect(result.created_at).toEqual(testBoard.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > testBoard.updated_at).toBe(true);
  });

  it('should update both name and description', async () => {
    // Create a test board first
    const testBoard = await createTestBoard({
      name: 'Original Board',
      description: 'Original description'
    });

    const updateInput: UpdateBoardInput = {
      id: testBoard.id,
      name: 'Updated Board Name',
      description: 'Updated description'
    };

    const result = await updateBoard(updateInput);

    // Verify all updated fields
    expect(result.id).toEqual(testBoard.id);
    expect(result.name).toEqual('Updated Board Name');
    expect(result.description).toEqual('Updated description');
    expect(result.created_at).toEqual(testBoard.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > testBoard.updated_at).toBe(true);
  });

  it('should set description to null when explicitly provided', async () => {
    // Create a test board with a description
    const testBoard = await createTestBoard({
      name: 'Test Board',
      description: 'Original description'
    });

    const updateInput: UpdateBoardInput = {
      id: testBoard.id,
      description: null
    };

    const result = await updateBoard(updateInput);

    // Verify description is set to null
    expect(result.id).toEqual(testBoard.id);
    expect(result.name).toEqual('Test Board'); // Should remain unchanged
    expect(result.description).toBeNull();
    expect(result.created_at).toEqual(testBoard.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > testBoard.updated_at).toBe(true);
  });

  it('should save updates to database', async () => {
    // Create a test board first
    const testBoard = await createTestBoard({
      name: 'Original Board',
      description: 'Original description'
    });

    const updateInput: UpdateBoardInput = {
      id: testBoard.id,
      name: 'Updated Board Name',
      description: 'Updated description'
    };

    await updateBoard(updateInput);

    // Query the database directly to verify changes were persisted
    const boards = await db.select()
      .from(boardsTable)
      .where(eq(boardsTable.id, testBoard.id))
      .execute();

    expect(boards).toHaveLength(1);
    expect(boards[0].name).toEqual('Updated Board Name');
    expect(boards[0].description).toEqual('Updated description');
    expect(boards[0].updated_at).toBeInstanceOf(Date);
    expect(boards[0].updated_at > testBoard.updated_at).toBe(true);
  });

  it('should throw error when board does not exist', async () => {
    const updateInput: UpdateBoardInput = {
      id: 999, // Non-existent ID
      name: 'Updated Board Name'
    };

    await expect(updateBoard(updateInput)).rejects.toThrow(/Board with id 999 not found/i);
  });

  it('should handle partial updates correctly', async () => {
    // Create a test board with null description
    const testBoard = await createTestBoard({
      name: 'Test Board',
      description: null
    });

    // Update only the name, leaving description as null
    const updateInput: UpdateBoardInput = {
      id: testBoard.id,
      name: 'Partially Updated Board'
    };

    const result = await updateBoard(updateInput);

    expect(result.name).toEqual('Partially Updated Board');
    expect(result.description).toBeNull(); // Should remain null
    expect(result.updated_at > testBoard.updated_at).toBe(true);
  });

  it('should always update the updated_at timestamp', async () => {
    // Create a test board first
    const testBoard = await createTestBoard({
      name: 'Test Board',
      description: 'Test description'
    });

    // Store the original updated_at time
    const originalUpdatedAt = testBoard.updated_at;

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    // Update with the same values (should still update timestamp)
    const updateInput: UpdateBoardInput = {
      id: testBoard.id,
      name: 'Test Board', // Same value
      description: 'Test description' // Same value
    };

    const result = await updateBoard(updateInput);

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > originalUpdatedAt).toBe(true);
  });
});