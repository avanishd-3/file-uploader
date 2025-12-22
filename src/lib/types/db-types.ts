import type { ExtractTablesWithRelations,} from 'drizzle-orm';
import type { NodePgQueryResultHKT } from 'drizzle-orm/node-postgres';
import { type PgTransaction } from 'drizzle-orm/pg-core';
import type * as schema from "@/server/db/schema";

export type Transaction = PgTransaction<NodePgQueryResultHKT, typeof schema, ExtractTablesWithRelations<typeof schema>>;