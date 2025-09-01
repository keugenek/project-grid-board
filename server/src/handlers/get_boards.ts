import { db } from '../db';
import { boardsTable } from '../db/schema';
import { type Board } from '../schema';
import { desc } from 'drizzle-orm';

export const getBoards = async (): Promise<Board[]> => {
  try {
    // Fetch all boards ordered by most recently updated first
    const results = await db.select()
      .from(boardsTable)
      .orderBy(desc(boardsTable.updated_at))
      .execute();

    // Return results as-is since no numeric conversions needed for boards table
    return results;
  } catch (error) {
    console.error('Failed to fetch boards:', error);
    throw error;
  }
};