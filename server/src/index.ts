import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schema types
import { 
  createBoardInputSchema,
  updateBoardInputSchema,
  getBoardInputSchema,
  createItemInputSchema,
  updateItemInputSchema,
  updateItemPositionInputSchema,
  getItemsByBoardInputSchema,
  getItemInputSchema
} from './schema';

// Import handlers
import { createBoard } from './handlers/create_board';
import { getBoards } from './handlers/get_boards';
import { getBoard } from './handlers/get_board';
import { updateBoard } from './handlers/update_board';
import { deleteBoard } from './handlers/delete_board';
import { createItem } from './handlers/create_item';
import { getItemsByBoard } from './handlers/get_items_by_board';
import { getItem } from './handlers/get_item';
import { updateItem } from './handlers/update_item';
import { updateItemPosition } from './handlers/update_item_position';
import { deleteItem } from './handlers/delete_item';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Board operations
  createBoard: publicProcedure
    .input(createBoardInputSchema)
    .mutation(({ input }) => createBoard(input)),

  getBoards: publicProcedure
    .query(() => getBoards()),

  getBoard: publicProcedure
    .input(getBoardInputSchema)
    .query(({ input }) => getBoard(input)),

  updateBoard: publicProcedure
    .input(updateBoardInputSchema)
    .mutation(({ input }) => updateBoard(input)),

  deleteBoard: publicProcedure
    .input(getBoardInputSchema)
    .mutation(({ input }) => deleteBoard(input)),

  // Item operations
  createItem: publicProcedure
    .input(createItemInputSchema)
    .mutation(({ input }) => createItem(input)),

  getItemsByBoard: publicProcedure
    .input(getItemsByBoardInputSchema)
    .query(({ input }) => getItemsByBoard(input)),

  getItem: publicProcedure
    .input(getItemInputSchema)
    .query(({ input }) => getItem(input)),

  updateItem: publicProcedure
    .input(updateItemInputSchema)
    .mutation(({ input }) => updateItem(input)),

  updateItemPosition: publicProcedure
    .input(updateItemPositionInputSchema)
    .mutation(({ input }) => updateItemPosition(input)),

  deleteItem: publicProcedure
    .input(getItemInputSchema)
    .mutation(({ input }) => deleteItem(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
  console.log('Available endpoints:');
  console.log('- Board operations: createBoard, getBoards, getBoard, updateBoard, deleteBoard');
  console.log('- Item operations: createItem, getItemsByBoard, getItem, updateItem, updateItemPosition, deleteItem');
}

start();