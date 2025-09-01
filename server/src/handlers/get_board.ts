import { db } from '../db';
import { boardsTable } from '../db/schema';
import { type GetBoardInput, type Board } from '../schema';
import { eq } from 'drizzle-orm';

export const getBoard = async (input: GetBoardInput): Promise<Board | null> => {
  try {
    // Query for the board by ID
    const results = await db.select()
      .from(boardsTable)
      .where(eq(boardsTable.id, input.id))
      .execute();

    // Return null if board not found
    if (results.length === 0) {
      return null;
    }

    // Return the found board
    const board = results[0];
    return {
      ...board
    };
  } catch (error) {
    console.error('Board retrieval failed:', error);
    throw error;
  }
};