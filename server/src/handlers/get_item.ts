import { db } from '../db';
import { itemsTable } from '../db/schema';
import { type GetItemInput, type Item } from '../schema';
import { eq } from 'drizzle-orm';

export const getItem = async (input: GetItemInput): Promise<Item | null> => {
  try {
    // Query for the item by ID
    const result = await db.select()
      .from(itemsTable)
      .where(eq(itemsTable.id, input.id))
      .execute();

    if (result.length === 0) {
      return null;
    }

    const item = result[0];
    
    // Convert real (numeric) fields back to numbers
    return {
      ...item,
      position_x: parseFloat(item.position_x.toString()),
      position_y: parseFloat(item.position_y.toString()),
      width: parseFloat(item.width.toString()),
      height: parseFloat(item.height.toString())
    };
  } catch (error) {
    console.error('Get item failed:', error);
    throw error;
  }
};