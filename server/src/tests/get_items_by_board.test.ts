import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { boardsTable, itemsTable } from '../db/schema';
import { type GetItemsByBoardInput } from '../schema';
import { getItemsByBoard } from '../handlers/get_items_by_board';

describe('getItemsByBoard', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array for board with no items', async () => {
    // Create a board first
    const boardResult = await db.insert(boardsTable)
      .values({
        name: 'Test Board',
        description: 'A board for testing'
      })
      .returning()
      .execute();

    const input: GetItemsByBoardInput = {
      board_id: boardResult[0].id
    };

    const result = await getItemsByBoard(input);

    expect(result).toEqual([]);
  });

  it('should return items for a specific board', async () => {
    // Create a board
    const boardResult = await db.insert(boardsTable)
      .values({
        name: 'Test Board',
        description: 'A board for testing'
      })
      .returning()
      .execute();

    const boardId = boardResult[0].id;

    // Create items for the board
    await db.insert(itemsTable)
      .values([
        {
          board_id: boardId,
          title: 'Item 1',
          description: 'First item',
          status: 'todo' as const,
          position_x: 10.5, // Insert as number for real column
          position_y: 20.5,
          width: 200,
          height: 150
        },
        {
          board_id: boardId,
          title: 'Item 2',
          description: 'Second item',
          status: 'in_progress' as const,
          position_x: 50.25,
          position_y: 75.75,
          width: 300,
          height: 200
        }
      ])
      .execute();

    const input: GetItemsByBoardInput = {
      board_id: boardId
    };

    const result = await getItemsByBoard(input);

    expect(result).toHaveLength(2);

    // Verify first item
    expect(result[0].title).toBe('Item 1');
    expect(result[0].description).toBe('First item');
    expect(result[0].status).toBe('todo');
    expect(result[0].board_id).toBe(boardId);
    expect(typeof result[0].position_x).toBe('number');
    expect(result[0].position_x).toBe(10.5);
    expect(typeof result[0].position_y).toBe('number');
    expect(result[0].position_y).toBe(20.5);
    expect(typeof result[0].width).toBe('number');
    expect(result[0].width).toBe(200);
    expect(typeof result[0].height).toBe('number');
    expect(result[0].height).toBe(150);

    // Verify second item
    expect(result[1].title).toBe('Item 2');
    expect(result[1].description).toBe('Second item');
    expect(result[1].status).toBe('in_progress');
    expect(result[1].board_id).toBe(boardId);
    expect(result[1].position_x).toBe(50.25);
    expect(result[1].position_y).toBe(75.75);
    expect(result[1].width).toBe(300);
    expect(result[1].height).toBe(200);

    // Verify all items have required fields
    result.forEach(item => {
      expect(item.id).toBeDefined();
      expect(item.created_at).toBeInstanceOf(Date);
      expect(item.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should only return items for specified board', async () => {
    // Create two boards
    const boardResults = await db.insert(boardsTable)
      .values([
        {
          name: 'Board 1',
          description: 'First board'
        },
        {
          name: 'Board 2',
          description: 'Second board'
        }
      ])
      .returning()
      .execute();

    const board1Id = boardResults[0].id;
    const board2Id = boardResults[1].id;

    // Create items for both boards
    await db.insert(itemsTable)
      .values([
        {
          board_id: board1Id,
          title: 'Board 1 Item',
          description: 'Item for board 1',
          status: 'todo' as const
        },
        {
          board_id: board2Id,
          title: 'Board 2 Item',
          description: 'Item for board 2',
          status: 'done' as const
        }
      ])
      .execute();

    // Query items for board 1 only
    const input: GetItemsByBoardInput = {
      board_id: board1Id
    };

    const result = await getItemsByBoard(input);

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Board 1 Item');
    expect(result[0].board_id).toBe(board1Id);
  });

  it('should return items ordered by creation time', async () => {
    // Create a board
    const boardResult = await db.insert(boardsTable)
      .values({
        name: 'Test Board',
        description: 'A board for testing'
      })
      .returning()
      .execute();

    const boardId = boardResult[0].id;

    // Create items with slight delay to ensure different timestamps
    const item1Result = await db.insert(itemsTable)
      .values({
        board_id: boardId,
        title: 'First Created Item',
        description: 'Created first',
        status: 'todo' as const
      })
      .returning()
      .execute();

    // Small delay to ensure different creation times
    await new Promise(resolve => setTimeout(resolve, 10));

    const item2Result = await db.insert(itemsTable)
      .values({
        board_id: boardId,
        title: 'Second Created Item',
        description: 'Created second',
        status: 'done' as const
      })
      .returning()
      .execute();

    const input: GetItemsByBoardInput = {
      board_id: boardId
    };

    const result = await getItemsByBoard(input);

    expect(result).toHaveLength(2);
    
    // Items should be ordered by creation time (ascending)
    expect(result[0].title).toBe('First Created Item');
    expect(result[1].title).toBe('Second Created Item');
    
    // Verify the timestamps are ordered correctly
    expect(result[0].created_at.getTime()).toBeLessThanOrEqual(result[1].created_at.getTime());
  });

  it('should handle items with null values correctly', async () => {
    // Create a board
    const boardResult = await db.insert(boardsTable)
      .values({
        name: 'Test Board',
        description: 'A board for testing'
      })
      .returning()
      .execute();

    const boardId = boardResult[0].id;

    // Create an item with null description and xml_content
    await db.insert(itemsTable)
      .values({
        board_id: boardId,
        title: 'Item with nulls',
        description: null,
        status: 'review' as const,
        xml_content: null
      })
      .execute();

    const input: GetItemsByBoardInput = {
      board_id: boardId
    };

    const result = await getItemsByBoard(input);

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Item with nulls');
    expect(result[0].description).toBeNull();
    expect(result[0].xml_content).toBeNull();
    expect(result[0].status).toBe('review');
    
    // Default numeric values should still be converted to numbers
    expect(typeof result[0].position_x).toBe('number');
    expect(typeof result[0].position_y).toBe('number');
    expect(typeof result[0].width).toBe('number');
    expect(typeof result[0].height).toBe('number');
  });
});