import { SystemError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import cors from '@koa/cors';
import type { ParameterizedContext } from 'koa';
import Koa from 'koa';

import { isDevEnv, isTestEnv } from './constants';
import { logRoutes } from './logRoutes';
import mountedRoutes from './routes';

export const app = new Koa();

// CORS middleware configuration
app.use(
  cors({
    origin: (ctx) => {
      const origin = ctx.request.headers.origin as string;
      if (isDevEnv || isTestEnv) {
        return origin;
      }
      // support any subdomain for staging
      else if (origin.endsWith('.charmverse.co') || origin.endsWith('.charmverse.io')) {
        return origin;
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

// JSON Body parser middleware
app.use(async (ctx, next) => {
  let data = '';
  await new Promise<void>((resolve, reject) => {
    ctx.req.on('data', (chunk) => {
      data += chunk;
    });
    ctx.req.on('end', () => {
      resolve();
    });
    ctx.req.on('error', (err) => {
      reject(err);
    });
  });

  try {
    ctx.request.body = JSON.parse(data);
  } catch (err) {
    ctx.request.body = data;
  }

  await next();
});

app.use(mountedRoutes.routes()).use(mountedRoutes.allowedMethods());

logRoutes(mountedRoutes);
