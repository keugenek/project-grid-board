import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { boardsTable, itemsTable } from '../db/schema';
import { type UpdateItemInput } from '../schema';
import { updateItem } from '../handlers/update_item';
import { eq } from 'drizzle-orm';

describe('updateItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a test board
  const createTestBoard = async () => {
    const result = await db.insert(boardsTable)
      .values({
        name: 'Test Board',
        description: 'A test board'
      })
      .returning()
      .execute();
    return result[0];
  };

  // Helper function to create a test item
  const createTestItem = async (boardId: number) => {
    const result = await db.insert(itemsTable)
      .values({
        board_id: boardId,
        title: 'Original Item',
        description: 'Original description',
        status: 'todo',
        xml_content: '<root>original</root>',
        position_x: 100,
        position_y: 200,
        width: 300,
        height: 400
      })
      .returning()
      .execute();
    return result[0];
  };

  it('should update item title', async () => {
    const board = await createTestBoard();
    const item = await createTestItem(board.id);

    const input: UpdateItemInput = {
      id: item.id,
      title: 'Updated Title'
    };

    const result = await updateItem(input);

    expect(result.id).toBe(item.id);
    expect(result.title).toBe('Updated Title');
    expect(result.description).toBe(item.description); // Unchanged
    expect(result.status).toBe(item.status); // Unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(item.updated_at.getTime());
  });

  it('should update item description to null', async () => {
    const board = await createTestBoard();
    const item = await createTestItem(board.id);

    const input: UpdateItemInput = {
      id: item.id,
      description: null
    };

    const result = await updateItem(input);

    expect(result.description).toBeNull();
    expect(result.title).toBe(item.title); // Unchanged
  });

  it('should update item status', async () => {
    const board = await createTestBoard();
    const item = await createTestItem(board.id);

    const input: UpdateItemInput = {
      id: item.id,
      status: 'done'
    };

    const result = await updateItem(input);

    expect(result.status).toBe('done');
    expect(result.title).toBe(item.title); // Unchanged
  });

  it('should update item position and dimensions', async () => {
    const board = await createTestBoard();
    const item = await createTestItem(board.id);

    const input: UpdateItemInput = {
      id: item.id,
      position_x: 150.5,
      position_y: 250.7,
      width: 350,
      height: 450
    };

    const result = await updateItem(input);

    expect(result.position_x).toBe(150.5);
    expect(result.position_y).toBe(250.7);
    expect(result.width).toBe(350);
    expect(result.height).toBe(450);
    expect(typeof result.position_x).toBe('number');
    expect(typeof result.position_y).toBe('number');
    expect(typeof result.width).toBe('number');
    expect(typeof result.height).toBe('number');
  });

  it('should update xml_content', async () => {
    const board = await createTestBoard();
    const item = await createTestItem(board.id);

    const input: UpdateItemInput = {
      id: item.id,
      xml_content: '<root><updated>content</updated></root>'
    };

    const result = await updateItem(input);

    expect(result.xml_content).toBe('<root><updated>content</updated></root>');
    expect(result.title).toBe(item.title); // Unchanged
  });

  it('should update xml_content to null', async () => {
    const board = await createTestBoard();
    const item = await createTestItem(board.id);

    const input: UpdateItemInput = {
      id: item.id,
      xml_content: null
    };

    const result = await updateItem(input);

    expect(result.xml_content).toBeNull();
  });

  it('should update multiple fields at once', async () => {
    const board = await createTestBoard();
    const item = await createTestItem(board.id);

    const input: UpdateItemInput = {
      id: item.id,
      title: 'Multi Update Title',
      description: 'Multi Update Description',
      status: 'in_progress',
      position_x: 500,
      position_y: 600,
      width: 700,
      height: 800
    };

    const result = await updateItem(input);

    expect(result.title).toBe('Multi Update Title');
    expect(result.description).toBe('Multi Update Description');
    expect(result.status).toBe('in_progress');
    expect(result.position_x).toBe(500);
    expect(result.position_y).toBe(600);
    expect(result.width).toBe(700);
    expect(result.height).toBe(800);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save updated item to database', async () => {
    const board = await createTestBoard();
    const item = await createTestItem(board.id);

    const input: UpdateItemInput = {
      id: item.id,
      title: 'Database Update Test',
      status: 'review'
    };

    await updateItem(input);

    // Verify the item was updated in the database
    const savedItems = await db.select()
      .from(itemsTable)
      .where(eq(itemsTable.id, item.id))
      .execute();

    expect(savedItems).toHaveLength(1);
    expect(savedItems[0].title).toBe('Database Update Test');
    expect(savedItems[0].status).toBe('review');
    expect(savedItems[0].updated_at).toBeInstanceOf(Date);
    expect(savedItems[0].updated_at.getTime()).toBeGreaterThan(item.updated_at.getTime());
  });

  it('should throw error for non-existent item', async () => {
    const input: UpdateItemInput = {
      id: 99999,
      title: 'Non-existent Item'
    };

    await expect(updateItem(input)).rejects.toThrow(/Item with id 99999 not found/);
  });

  it('should handle zero values for position and dimensions', async () => {
    const board = await createTestBoard();
    const item = await createTestItem(board.id);

    const input: UpdateItemInput = {
      id: item.id,
      position_x: 0,
      position_y: 0,
      width: 1, // Minimum positive value based on schema
      height: 1
    };

    const result = await updateItem(input);

    expect(result.position_x).toBe(0);
    expect(result.position_y).toBe(0);
    expect(result.width).toBe(1);
    expect(result.height).toBe(1);
  });

  it('should preserve unchanged fields when updating some fields', async () => {
    const board = await createTestBoard();
    const item = await createTestItem(board.id);

    const input: UpdateItemInput = {
      id: item.id,
      title: 'Only Title Updated'
    };

    const result = await updateItem(input);

    // Check that only title was updated, other fields preserved
    expect(result.title).toBe('Only Title Updated');
    expect(result.description).toBe(item.description);
    expect(result.status).toBe(item.status);
    expect(result.xml_content).toBe(item.xml_content);
    expect(result.position_x).toBe(typeof item.position_x === 'string' ? parseFloat(item.position_x) : item.position_x);
    expect(result.position_y).toBe(typeof item.position_y === 'string' ? parseFloat(item.position_y) : item.position_y);
    expect(result.width).toBe(typeof item.width === 'string' ? parseFloat(item.width) : item.width);
    expect(result.height).toBe(typeof item.height === 'string' ? parseFloat(item.height) : item.height);
    expect(result.board_id).toBe(item.board_id);
    expect(result.created_at).toEqual(item.created_at);
  });
});