import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { boardsTable, itemsTable } from '../db/schema';
import { type GetItemInput } from '../schema';
import { getItem } from '../handlers/get_item';

describe('getItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an item when found', async () => {
    // Create a board first (required for foreign key)
    const boardResult = await db.insert(boardsTable)
      .values({
        name: 'Test Board',
        description: 'Board for testing'
      })
      .returning()
      .execute();
    
    const boardId = boardResult[0].id;

    // Create a test item
    const itemResult = await db.insert(itemsTable)
      .values({
        board_id: boardId,
        title: 'Test Item',
        description: 'Item for testing',
        status: 'in_progress',
        xml_content: '<test>content</test>',
        position_x: 150,
        position_y: 250,
        width: 300,
        height: 200
      })
      .returning()
      .execute();
    
    const itemId = itemResult[0].id;

    // Test the handler
    const input: GetItemInput = { id: itemId };
    const result = await getItem(input);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(itemId);
    expect(result!.board_id).toEqual(boardId);
    expect(result!.title).toEqual('Test Item');
    expect(result!.description).toEqual('Item for testing');
    expect(result!.status).toEqual('in_progress');
    expect(result!.xml_content).toEqual('<test>content</test>');
    expect(result!.position_x).toEqual(150);
    expect(result!.position_y).toEqual(250);
    expect(result!.width).toEqual(300);
    expect(result!.height).toEqual(200);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);

    // Verify numeric types are correct
    expect(typeof result!.position_x).toBe('number');
    expect(typeof result!.position_y).toBe('number');
    expect(typeof result!.width).toBe('number');
    expect(typeof result!.height).toBe('number');
  });

  it('should return null when item not found', async () => {
    const input: GetItemInput = { id: 99999 };
    const result = await getItem(input);

    expect(result).toBeNull();
  });

  it('should handle items with null description and xml_content', async () => {
    // Create a board first
    const boardResult = await db.insert(boardsTable)
      .values({
        name: 'Test Board',
        description: null
      })
      .returning()
      .execute();
    
    const boardId = boardResult[0].id;

    // Create an item with null optional fields
    const itemResult = await db.insert(itemsTable)
      .values({
        board_id: boardId,
        title: 'Minimal Item',
        description: null,
        status: 'todo',
        xml_content: null,
        position_x: 0,
        position_y: 0,
        width: 200,
        height: 150
      })
      .returning()
      .execute();
    
    const itemId = itemResult[0].id;

    // Test the handler
    const input: GetItemInput = { id: itemId };
    const result = await getItem(input);

    // Verify the result handles null values correctly
    expect(result).not.toBeNull();
    expect(result!.title).toEqual('Minimal Item');
    expect(result!.description).toBeNull();
    expect(result!.xml_content).toBeNull();
    expect(result!.status).toEqual('todo');
    expect(result!.position_x).toEqual(0);
    expect(result!.position_y).toEqual(0);
    expect(result!.width).toEqual(200);
    expect(result!.height).toEqual(150);
  });

  it('should handle different item statuses correctly', async () => {
    // Create a board first
    const boardResult = await db.insert(boardsTable)
      .values({
        name: 'Status Test Board',
        description: 'Testing different statuses'
      })
      .returning()
      .execute();
    
    const boardId = boardResult[0].id;

    // Create items with different statuses
    const statuses = ['todo', 'in_progress', 'review', 'done', 'archived'] as const;
    
    for (const status of statuses) {
      const itemResult = await db.insert(itemsTable)
        .values({
          board_id: boardId,
          title: `${status} Item`,
          description: `Item with ${status} status`,
          status: status,
          xml_content: null,
          position_x: 10,
          position_y: 20,
          width: 250,
          height: 180
        })
        .returning()
        .execute();
      
      const itemId = itemResult[0].id;
      const input: GetItemInput = { id: itemId };
      const result = await getItem(input);

      expect(result).not.toBeNull();
      expect(result!.status).toEqual(status);
      expect(result!.title).toEqual(`${status} Item`);
    }
  });
});