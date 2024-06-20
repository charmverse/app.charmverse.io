import { SystemError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import cors from '@koa/cors';
import Koa from 'koa';
import type Router from 'koa-router';

import { prettyPrint } from 'lib/utils/strings';

import mountedRoutes from './routes';

function logRoutes(router: Router) {
  log.info('---- List of routes available ----');
  router.stack.forEach((layer) => {
    const _path = layer.opts.prefix || layer.path || '';
    const methods = layer.methods.filter((method) => method !== 'HEAD');

    if (_path && methods.length) {
      log.info(`${_path}: ${methods.join(', ')}`);
    }
  });
  log.info('---- Finished checking routes ----');
}

export const app = new Koa();

const allowedOrigins = process.env.ALLOWED_CONNECT_ORIGINS?.split(',') ?? ['http://localhost:3000'];

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

app.use(mountedRoutes.routes()).use(mountedRoutes.allowedMethods());

logRoutes(mountedRoutes);
