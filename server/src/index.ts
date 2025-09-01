import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schema types
import { 
  createBoardInputSchema,
  updateBoardInputSchema,
  createBoardItemInputSchema,
  updateBoardItemInputSchema,
  getBoardItemsInputSchema,
  createXmlDiagramInputSchema,
  updateXmlDiagramInputSchema
} from './schema';

// Import handler functions
import { createBoard } from './handlers/create_board';
import { getBoards } from './handlers/get_boards';
import { getBoardById } from './handlers/get_board_by_id';
import { updateBoard } from './handlers/update_board';
import { deleteBoard } from './handlers/delete_board';
import { createBoardItem } from './handlers/create_board_item';
import { getBoardItems } from './handlers/get_board_items';
import { getBoardItemById } from './handlers/get_board_item_by_id';
import { updateBoardItem } from './handlers/update_board_item';
import { deleteBoardItem } from './handlers/delete_board_item';
import { createXmlDiagram } from './handlers/create_xml_diagram';
import { updateXmlDiagram } from './handlers/update_xml_diagram';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check endpoint
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Board management routes
  createBoard: publicProcedure
    .input(createBoardInputSchema)
    .mutation(({ input }) => createBoard(input)),

  getBoards: publicProcedure
    .query(() => getBoards()),

  getBoardById: publicProcedure
    .input(z.object({ id: z.number().positive() }))
    .query(({ input }) => getBoardById(input.id)),

  updateBoard: publicProcedure
    .input(updateBoardInputSchema)
    .mutation(({ input }) => updateBoard(input)),

  deleteBoard: publicProcedure
    .input(z.object({ id: z.number().positive() }))
    .mutation(({ input }) => deleteBoard(input.id)),

  // Board item management routes
  createBoardItem: publicProcedure
    .input(createBoardItemInputSchema)
    .mutation(({ input }) => createBoardItem(input)),

  getBoardItems: publicProcedure
    .input(getBoardItemsInputSchema)
    .query(({ input }) => getBoardItems(input)),

  getBoardItemById: publicProcedure
    .input(z.object({ id: z.number().positive() }))
    .query(({ input }) => getBoardItemById(input.id)),

  updateBoardItem: publicProcedure
    .input(updateBoardItemInputSchema)
    .mutation(({ input }) => updateBoardItem(input)),

  deleteBoardItem: publicProcedure
    .input(z.object({ id: z.number().positive() }))
    .mutation(({ input }) => deleteBoardItem(input.id)),

  // XML diagram specific routes
  createXmlDiagram: publicProcedure
    .input(createXmlDiagramInputSchema)
    .mutation(({ input }) => createXmlDiagram(input)),

  updateXmlDiagram: publicProcedure
    .input(updateXmlDiagramInputSchema)
    .mutation(({ input }) => updateXmlDiagram(input)),
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
}

start();