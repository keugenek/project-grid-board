import { db } from '../db';
import { itemsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type UpdateItemPositionInput, type Item } from '../schema';

export const updateItemPosition = async (input: UpdateItemPositionInput): Promise<Item> => {
  try {
    // Update only the position fields and updated_at timestamp
    const result = await db.update(itemsTable)
      .set({
        position_x: input.position_x,
        position_y: input.position_y,
        updated_at: new Date()
      })
      .where(eq(itemsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Item with id ${input.id} not found`);
    }

    // Convert numeric fields back to numbers for real/float columns
    const item = result[0];
    return {
      ...item,
      position_x: parseFloat(item.position_x.toString()),
      position_y: parseFloat(item.position_y.toString()),
      width: parseFloat(item.width.toString()),
      height: parseFloat(item.height.toString())
    };
  } catch (error) {
    console.error('Item position update failed:', error);
    throw error;
  }
};