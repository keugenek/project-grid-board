import { db } from '../db';
import { boardsTable } from '../db/schema';
import { type UpdateBoardInput, type Board } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateBoard(input: UpdateBoardInput): Promise<Board> {
  try {
    // Build the update object with only provided fields
    const updateData: any = {};
    
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    
    // Always update the updated_at timestamp
    updateData.updated_at = new Date();

    // Update the board and return the updated record
    const result = await db.update(boardsTable)
      .set(updateData)
      .where(eq(boardsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Board with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Board update failed:', error);
    throw error;
  }
}