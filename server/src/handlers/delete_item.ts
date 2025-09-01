import { db } from '../db';
import { itemsTable } from '../db/schema';
import { type GetItemInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteItem = async (input: GetItemInput): Promise<{ success: boolean }> => {
  try {
    const result = await db.delete(itemsTable)
      .where(eq(itemsTable.id, input.id))
      .execute();

    // Result contains information about affected rows
    // If no rows were affected, the item didn't exist
    const success = (result.rowCount ?? 0) > 0;
    
    return { success };
  } catch (error) {
    console.error('Item deletion failed:', error);
    throw error;
  }
};