import { db } from '../db';
import { itemsTable } from '../db/schema';
import { type CreateItemInput, type Item } from '../schema';

export const createItem = async (input: CreateItemInput): Promise<Item> => {
  try {
    // Insert item record
    const result = await db.insert(itemsTable)
      .values({
        board_id: input.board_id,
        title: input.title,
        description: input.description,
        status: input.status, // Already has default from Zod
        xml_content: input.xml_content,
        position_x: input.position_x, // Real column - no conversion needed
        position_y: input.position_y, // Real column - no conversion needed
        width: input.width, // Real column - no conversion needed
        height: input.height // Real column - no conversion needed
      })
      .returning()
      .execute();

    // Return the item directly - real columns return as numbers
    const item = result[0];
    return item;
  } catch (error) {
    console.error('Item creation failed:', error);
    throw error;
  }
};