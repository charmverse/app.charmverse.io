import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { SystemError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import cors from '@koa/cors';
import Koa from 'koa';
import Router from 'koa-router';

function logRoutes(router: Router) {
  log.info('List of routes available:');
  router.stack.forEach((layer) => {
    const _path = layer.opts.prefix || layer.path || '';
    const methods = layer.methods.filter((method) => method !== 'HEAD');
    if (path) {
      log.info(`${_path}: ${methods.join(', ')}`);
    }
  });
}

async function loadRoutes(dir: string, rootRouter: Router) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const absolutePath = path.join(dir, file);
    const stat = fs.statSync(absolutePath);

    if (stat.isDirectory()) {
      await loadRoutes(absolutePath, rootRouter);
    } else if (file.endsWith('.ts')) {
      const router = (await import(absolutePath)).default as Router;

      rootRouter.use(router.routes());
    }
  }
}

export async function prepareServer(): Promise<Koa> {
  const app = new Koa();
  const rootRouter = new Router();

  const allowedOrigins = process.env.ALLOWED_CONNECT_ORIGINS?.split(',') ?? ['http://localhost:3000'];

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const apiDir = path.join(__dirname, 'api');

  // CORS middleware configuration
  app.use(
    cors({
      origin: (ctx) => {
        const origin = ctx.request.headers.origin as string;
        const isAllowed = allowedOrigins.includes(origin as string);
        if (isAllowed) {
          return origin; // Allow the request from this origin
        }
        return ''; // Disallow the request if the origin is not allowed
      },
      credentials: true
    })
  );

  // Error handling middleware
  app.use(async (ctx, next) => {
    try {
      await next();
    } catch (err) {
      log.error(err);
      if (err instanceof SystemError) {
        ctx.body = {
          message: err.message,
          severity: err.severity
        };
        ctx.status = err.code;
      } else {
        ctx.body = {
          message: (err as any).message ?? 'Internal Server Error'
        };
        ctx.status = 500;
      }
    }
  });

  await loadRoutes(apiDir, rootRouter);

  app.use(rootRouter.routes()).use(rootRouter.allowedMethods());

  logRoutes(rootRouter);

  return app;
}
