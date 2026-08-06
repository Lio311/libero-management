 
 
 
/* eslint-disable @typescript-eslint/no-explicit-any */
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || 'postgres://dummy:dummy@dummy.neon.tech/dummy';

// We use standard pg Pool because neon-http throws 'fetch failed' in this specific node environment
const pool = new Pool({
  connectionString,
});

export const db = drizzle(pool, { schema });
