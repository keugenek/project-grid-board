import { db } from '../db';
import { boardsTable } from '../db/schema';
import { type GetBoardInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function deleteBoard(input: GetBoardInput): Promise<{ success: boolean }> {
  try {
    // Delete the board by ID - cascade delete will automatically handle items
    const result = await db.delete(boardsTable)
      .where(eq(boardsTable.id, input.id))
      .returning()
      .execute();

    // Return success based on whether a row was deleted
    return { success: result.length > 0 };
  } catch (error) {
    console.error('Board deletion failed:', error);
    throw error;
  }
}