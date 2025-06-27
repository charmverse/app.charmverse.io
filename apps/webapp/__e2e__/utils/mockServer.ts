import type { Server } from 'http';

import Router from '@koa/router';
import { log } from '@packages/core/log';
import Koa from 'koa';

export function createServer() {
  const app = new Koa();
  const router = new Router();

  return {
    router,
    listen(port: number): Promise<Server> {
      app.use(errorHandler).use(router.routes()).use(router.allowedMethods());
      const server = app.listen(port);
      return new Promise((ready) => {
        server.once('listening', () => ready(server));
      });
    }
  };
}

async function errorHandler(ctx: Koa.Context, next: () => Promise<any>) {
  try {
    await next();
  } catch (err: any) {
    log.error('Mock Server Error', { status: err.status, error: err.message, errorRaw: err });
    ctx.status = err.status || 500;
    ctx.body = err.message;
  }
}
