import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { boardsTable, itemsTable } from '../db/schema';
import { type CreateItemInput } from '../schema';
import { createItem } from '../handlers/create_item';
import { eq } from 'drizzle-orm';

// Create a test board first for foreign key reference
const createTestBoard = async () => {
  const result = await db.insert(boardsTable)
    .values({
      name: 'Test Board',
      description: 'A board for testing'
    })
    .returning()
    .execute();
  return result[0];
};

// Simple test input with all required fields
const testInput: CreateItemInput = {
  board_id: 1, // Will be updated in tests after creating board
  title: 'Test Item',
  description: 'A test item description',
  status: 'todo',
  xml_content: '<item>test</item>',
  position_x: 100,
  position_y: 200,
  width: 300,
  height: 250
};

// Minimal input using Zod defaults
const minimalInput = {
  board_id: 1,
  title: 'Minimal Item',
  description: null,
  status: 'todo' as const,
  xml_content: null,
  position_x: 0,
  position_y: 0,
  width: 200,
  height: 150
};

describe('createItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an item with all fields', async () => {
    // Create prerequisite board
    const board = await createTestBoard();
    const input = { ...testInput, board_id: board.id };

    const result = await createItem(input);

    // Basic field validation
    expect(result.board_id).toEqual(board.id);
    expect(result.title).toEqual('Test Item');
    expect(result.description).toEqual('A test item description');
    expect(result.status).toEqual('todo');
    expect(result.xml_content).toEqual('<item>test</item>');
    expect(result.position_x).toEqual(100);
    expect(result.position_y).toEqual(200);
    expect(result.width).toEqual(300);
    expect(result.height).toEqual(250);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify numeric types are correctly converted
    expect(typeof result.position_x).toBe('number');
    expect(typeof result.position_y).toBe('number');
    expect(typeof result.width).toBe('number');
    expect(typeof result.height).toBe('number');
  });

  it('should create an item with minimal input and defaults', async () => {
    const board = await createTestBoard();
    const input = { ...minimalInput, board_id: board.id };

    const result = await createItem(input);

    expect(result.board_id).toEqual(board.id);
    expect(result.title).toEqual('Minimal Item');
    expect(result.description).toBeNull();
    expect(result.status).toEqual('todo');
    expect(result.xml_content).toBeNull();
    expect(result.position_x).toEqual(0);
    expect(result.position_y).toEqual(0);
    expect(result.width).toEqual(200);
    expect(result.height).toEqual(150);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save item to database correctly', async () => {
    const board = await createTestBoard();
    const input = { ...testInput, board_id: board.id };

    const result = await createItem(input);

    // Query using proper drizzle syntax
    const items = await db.select()
      .from(itemsTable)
      .where(eq(itemsTable.id, result.id))
      .execute();

    expect(items).toHaveLength(1);
    const savedItem = items[0];
    
    expect(savedItem.board_id).toEqual(board.id);
    expect(savedItem.title).toEqual('Test Item');
    expect(savedItem.description).toEqual('A test item description');
    expect(savedItem.status).toEqual('todo');
    expect(savedItem.xml_content).toEqual('<item>test</item>');
    
    // Verify numeric fields are stored correctly (as real numbers in DB)
    expect(savedItem.position_x).toEqual(100);
    expect(savedItem.position_y).toEqual(200);
    expect(savedItem.width).toEqual(300);
    expect(savedItem.height).toEqual(250);
    
    expect(savedItem.created_at).toBeInstanceOf(Date);
    expect(savedItem.updated_at).toBeInstanceOf(Date);
  });

  it('should handle different item statuses', async () => {
    const board = await createTestBoard();
    const statuses = ['todo', 'in_progress', 'review', 'done', 'archived'] as const;

    for (const status of statuses) {
      const input: CreateItemInput = {
        ...testInput,
        board_id: board.id,
        title: `Item with ${status} status`,
        status: status
      };

      const result = await createItem(input);
      expect(result.status).toEqual(status);
      expect(result.title).toEqual(`Item with ${status} status`);
    }
  });

  it('should handle zero and negative positions', async () => {
    const board = await createTestBoard();
    const input: CreateItemInput = {
      ...testInput,
      board_id: board.id,
      title: 'Item with edge positions',
      position_x: -50,
      position_y: -100,
      width: 1,
      height: 1
    };

    const result = await createItem(input);
    
    expect(result.position_x).toEqual(-50);
    expect(result.position_y).toEqual(-100);
    expect(result.width).toEqual(1);
    expect(result.height).toEqual(1);
    expect(typeof result.position_x).toBe('number');
    expect(typeof result.position_y).toBe('number');
    expect(typeof result.width).toBe('number');
    expect(typeof result.height).toBe('number');
  });

  it('should create multiple items on the same board', async () => {
    const board = await createTestBoard();

    const item1Input = { ...testInput, board_id: board.id, title: 'First Item' };
    const item2Input = { ...testInput, board_id: board.id, title: 'Second Item', position_x: 500 };

    const item1 = await createItem(item1Input);
    const item2 = await createItem(item2Input);

    expect(item1.board_id).toEqual(board.id);
    expect(item2.board_id).toEqual(board.id);
    expect(item1.title).toEqual('First Item');
    expect(item2.title).toEqual('Second Item');
    expect(item1.position_x).toEqual(100);
    expect(item2.position_x).toEqual(500);
    expect(item1.id).not.toEqual(item2.id);

    // Verify both items exist in database
    const items = await db.select()
      .from(itemsTable)
      .where(eq(itemsTable.board_id, board.id))
      .execute();

    expect(items).toHaveLength(2);
  });

  it('should reject invalid board_id (foreign key constraint)', async () => {
    const input = { ...testInput, board_id: 999999 }; // Non-existent board

    await expect(createItem(input)).rejects.toThrow(/violates foreign key constraint|foreign key/i);
  });
});