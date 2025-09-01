import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schema types
import { 
  createItemInputSchema, 
  updateItemInputSchema,
  getItemsByParentInputSchema,
  getItemsByTypeInputSchema,
  deleteItemInputSchema
} from './schema';

// Import handlers
import { createItem } from './handlers/create_item';
import { getItems } from './handlers/get_items';
import { getItemById } from './handlers/get_item_by_id';
import { getItemsByParent } from './handlers/get_items_by_parent';
import { getItemsByType } from './handlers/get_items_by_type';
import { updateItem } from './handlers/update_item';
import { deleteItem } from './handlers/delete_item';

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

  // Item management endpoints
  createItem: publicProcedure
    .input(createItemInputSchema)
    .mutation(({ input }) => createItem(input)),

  getItems: publicProcedure
    .query(() => getItems()),

  getItemById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getItemById(input.id)),

  getItemsByParent: publicProcedure
    .input(getItemsByParentInputSchema)
    .query(({ input }) => getItemsByParent(input)),

  getItemsByType: publicProcedure
    .input(getItemsByTypeInputSchema)
    .query(({ input }) => getItemsByType(input)),

  updateItem: publicProcedure
    .input(updateItemInputSchema)
    .mutation(({ input }) => updateItem(input)),

  deleteItem: publicProcedure
    .input(deleteItemInputSchema)
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
}

start();