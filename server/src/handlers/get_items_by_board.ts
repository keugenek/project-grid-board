import { db } from '../db';
import { itemsTable } from '../db/schema';
import { type GetItemsByBoardInput, type Item } from '../schema';
import { eq, asc } from 'drizzle-orm';

export async function getItemsByBoard(input: GetItemsByBoardInput): Promise<Item[]> {
  try {
    // Query all items for the specified board, ordered by creation time
    const results = await db.select()
      .from(itemsTable)
      .where(eq(itemsTable.board_id, input.board_id))
      .orderBy(asc(itemsTable.created_at))
      .execute();

    // Return results directly - real columns are already numbers
    return results;
  } catch (error) {
    console.error('Failed to get items by board:', error);
    throw error;
  }
}