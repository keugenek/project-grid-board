import { db } from '../db';
import { boardsTable } from '../db/schema';
import { type CreateBoardInput, type Board } from '../schema';

export const createBoard = async (input: CreateBoardInput): Promise<Board> => {
  try {
    // Insert board record
    const result = await db.insert(boardsTable)
      .values({
        name: input.name,
        description: input.description
      })
      .returning()
      .execute();

    // Return the created board
    const board = result[0];
    return board;
  } catch (error) {
    console.error('Board creation failed:', error);
    throw error;
  }
};