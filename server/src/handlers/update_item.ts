import { db } from '../db';
import { itemsTable } from '../db/schema';
import { type UpdateItemInput, type Item } from '../schema';
import { eq } from 'drizzle-orm';

export const updateItem = async (input: UpdateItemInput): Promise<Item> => {
  try {
    // Build the update object with only provided fields
    const updateData: Partial<typeof itemsTable.$inferInsert> = {
      updated_at: new Date()
    };

    // Only include fields that are provided in the input
    if (input.title !== undefined) {
      updateData.title = input.title;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    if (input.status !== undefined) {
      updateData.status = input.status;
    }
    if (input.xml_content !== undefined) {
      updateData.xml_content = input.xml_content;
    }
    if (input.position_x !== undefined) {
      updateData.position_x = input.position_x;
    }
    if (input.position_y !== undefined) {
      updateData.position_y = input.position_y;
    }
    if (input.width !== undefined) {
      updateData.width = input.width;
    }
    if (input.height !== undefined) {
      updateData.height = input.height;
    }

    // Update the item and return the updated record
    const result = await db.update(itemsTable)
      .set(updateData)
      .where(eq(itemsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Item with id ${input.id} not found`);
    }

    // Convert numeric fields back to numbers before returning (they are stored as real/numeric)
    const item = result[0];
    return {
      ...item,
      position_x: typeof item.position_x === 'string' ? parseFloat(item.position_x) : item.position_x,
      position_y: typeof item.position_y === 'string' ? parseFloat(item.position_y) : item.position_y,
      width: typeof item.width === 'string' ? parseFloat(item.width) : item.width,
      height: typeof item.height === 'string' ? parseFloat(item.height) : item.height
    };
  } catch (error) {
    console.error('Item update failed:', error);
    throw error;
  }
};