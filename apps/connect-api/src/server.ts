/* eslint-disable no-console */
import { SystemError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import cors from '@koa/cors';
import { getIronSession } from 'iron-session';
import Koa from 'koa';

import { isProdEnv } from 'config/constants';
import type { SessionData } from 'lib/session/config';
import { getIronOptions } from 'lib/session/getIronOptions';

import { logRoutes } from './logRoutes';
import rootRouter from './routes';

export const app = new Koa();

// CORS middleware configuration
app.use(
  cors({
    origin: (ctx) => {
      // always pass health check. (the AWS load balancer does not send origin header)
      const path = ctx.request.path;
      if (path === '/api/health') {
        return '*';
      }
      // TODO: fix CORS
      return '*';
      // const origin = ctx.request.headers.origin;
      // // allow all origins in development and test environments
      // if (origin && (isDevEnv || isTestEnv)) {
      //   return origin;
      //   // support any subdomain for staging and production
      // } else if (origin?.endsWith('.charmverse.co') || origin?.endsWith('.charmverse.io')) {
      //   return origin;
      // }
      // log.warn('Origin not allowed', { path, headers: ctx.request.headers });
      // return ''; // Disallow the request if the origin is not allowed
    },
    credentials: true
  })
);

// for now, make sure we set cross-subdomain cookies
// be careful not to use this when the app serves multiple domains
const domain = isProdEnv ? 'charmverse.io' : undefined;

// Session middleware
app.use(async (ctx, next) => {
  ctx.request.session = await getIronSession<SessionData>(ctx.req, ctx.res, getIronOptions({ domain }));
  await next();
});

// Error handling middleware
app.use(async (ctx, next) => {
  try {
    await next();

    if (ctx.status === 404) {
      ctx.throw(404, 'Path not found!');
    }
  } catch (err) {
    let _log = log.error;
    if (ctx.status < 500) {
      _log = log.warn;
    }
    _log('Client error', {
      error: err,
      body: ctx.body,
      requestUrl: ctx.originalUrl,
      userId: ctx.request.session?.user?.id
    });
    if (err instanceof SystemError) {
      ctx.body = {
        message: err.message,
        severity: err.severity
      };
      ctx.status = err.code;
    } else {
      if (ctx.status < 400) {
        ctx.status = 500;
      } else {
        // set ctx.status so that koa does not override it to be 200 when we define the body
        // eslint-disable-next-line no-self-assign
        ctx.status = ctx.status;
      }
      ctx.body = {
        message: (err as any).message ?? 'Internal Server Error'
      };
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

rootRouter.get('/api/health', (ctx) => {
  ctx.body = { success: true };
  ctx.status = 200;
});

// respond to favicon.ico so it doesn't trigger an error if you load the api in a browser
rootRouter.get('/favicon.ico', (ctx) => {
  ctx.status = 200;
});

app.use(rootRouter.routes()).use(rootRouter.allowedMethods());

logRoutes(rootRouter);
