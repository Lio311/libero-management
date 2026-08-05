 
 
 
/* eslint-disable @typescript-eslint/no-explicit-any */
import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

neonConfig.fetchFunction = (url: any, options: any) => {
  return fetch(url, { ...options, cache: 'no-store' });
};

const sql = neon(process.env.DATABASE_URL || 'postgres://dummy:dummy@dummy.neon.tech/dummy');
export const db = drizzle(sql, { schema });
