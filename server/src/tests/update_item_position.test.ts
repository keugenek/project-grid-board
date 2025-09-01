import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { boardsTable, itemsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { updateItemPosition } from '../handlers/update_item_position';
import { type UpdateItemPositionInput } from '../schema';

describe('updateItemPosition', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testBoardId: number;
  let testItemId: number;

  beforeEach(async () => {
    // Create test board first
    const boardResult = await db.insert(boardsTable)
      .values({
        name: 'Test Board',
        description: 'Board for testing item position updates'
      })
      .returning()
      .execute();
    
    testBoardId = boardResult[0].id;

    // Create test item
    const itemResult = await db.insert(itemsTable)
      .values({
        board_id: testBoardId,
        title: 'Test Item',
        description: 'Item for position testing',
        status: 'todo',
        xml_content: null,
        position_x: 100,
        position_y: 200,
        width: 300,
        height: 250
      })
      .returning()
      .execute();
    
    testItemId = itemResult[0].id;
  });

  it('should update item position successfully', async () => {
    const input: UpdateItemPositionInput = {
      id: testItemId,
      position_x: 150.5,
      position_y: 275.25
    };

    const result = await updateItemPosition(input);

    // Verify returned data
    expect(result.id).toEqual(testItemId);
    expect(result.position_x).toEqual(150.5);
    expect(result.position_y).toEqual(275.25);
    expect(typeof result.position_x).toBe('number');
    expect(typeof result.position_y).toBe('number');
    
    // Verify other fields remain unchanged
    expect(result.title).toEqual('Test Item');
    expect(result.board_id).toEqual(testBoardId);
    expect(result.status).toEqual('todo');
    expect(result.width).toEqual(300);
    expect(result.height).toEqual(250);
    
    // Verify updated_at is recent
    expect(result.updated_at).toBeInstanceOf(Date);
    const timeDiff = Date.now() - result.updated_at.getTime();
    expect(timeDiff).toBeLessThan(5000); // Updated within last 5 seconds
  });

  it('should save position changes to database', async () => {
    const input: UpdateItemPositionInput = {
      id: testItemId,
      position_x: 500.75,
      position_y: 600.33
    };

    await updateItemPosition(input);

    // Query database directly to verify changes
    const items = await db.select()
      .from(itemsTable)
      .where(eq(itemsTable.id, testItemId))
      .execute();

    expect(items).toHaveLength(1);
    const savedItem = items[0];
    expect(parseFloat(savedItem.position_x.toString())).toEqual(500.75);
    expect(parseFloat(savedItem.position_y.toString())).toEqual(600.33);
    
    // Verify other fields weren't modified
    expect(savedItem.title).toEqual('Test Item');
    expect(savedItem.width.toString()).toEqual('300');
    expect(savedItem.height.toString()).toEqual('250');
  });

  it('should handle zero and negative coordinates', async () => {
    const input: UpdateItemPositionInput = {
      id: testItemId,
      position_x: -50.5,
      position_y: 0
    };

    const result = await updateItemPosition(input);

    expect(result.position_x).toEqual(-50.5);
    expect(result.position_y).toEqual(0);
  });

  it('should handle large coordinate values', async () => {
    const input: UpdateItemPositionInput = {
      id: testItemId,
      position_x: 9999.99,
      position_y: 8888.88
    };

    const result = await updateItemPosition(input);

    expect(result.position_x).toEqual(9999.99);
    expect(result.position_y).toEqual(8888.88);
  });

  it('should throw error when item does not exist', async () => {
    const input: UpdateItemPositionInput = {
      id: 99999, // Non-existent item ID
      position_x: 100,
      position_y: 200
    };

    await expect(updateItemPosition(input)).rejects.toThrow(/Item with id 99999 not found/i);
  });

  it('should preserve all numeric field types correctly', async () => {
    const input: UpdateItemPositionInput = {
      id: testItemId,
      position_x: 123.456,
      position_y: 789.123
    };

    const result = await updateItemPosition(input);

    // Verify all numeric fields are proper numbers, not strings
    expect(typeof result.position_x).toBe('number');
    expect(typeof result.position_y).toBe('number');
    expect(typeof result.width).toBe('number');
    expect(typeof result.height).toBe('number');
    expect(result.position_x).toEqual(123.456);
    expect(result.position_y).toEqual(789.123);
  });
});