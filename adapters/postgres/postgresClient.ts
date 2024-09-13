import { URL } from 'url';

import * as pg from 'pg';

const { Pool } = pg;

export function getClient(databaseUrl: string) {
  const params = new URL(databaseUrl);

  const config = {
    user: params.username,
    password: params.password,
    host: params.hostname,
    port: Number(params.port),
    database: params.pathname.split('/')[1],
    ssl: false
  };
  const pool = (global as any).pool || new Pool(config);
  (global as any).pool = pool;
  return pool;
}
