import { log } from '@charmverse/core/log';
import cors from '@koa/cors';
import Koa from 'koa';
import Router from 'koa-router';

import { randomIntFromInterval } from 'lib/utils/random';

import { isDevEnv, isTestEnv } from './constants';

export const app = new Koa();
const router = new Router();

// CORS middleware configuration
app.use(
  cors({
    origin: (ctx) => {
      const origin = ctx.request.headers.origin;
      const path = ctx.request.path;
      // always pass health check. (the AWS load balancer does not send origin header)
      if (path === '/api/health') {
        return '*';
      }
      // support any subdomain for staging and production
      else if (origin?.endsWith('.charmverse.co') || origin?.endsWith('.charmverse.io')) {
        return origin;
      }
      // dev environments allow any origin
      else if (origin && (isDevEnv || isTestEnv)) {
        return origin;
      }
      log.warn('Origin not allowed', ctx.request.headers);
      return ''; // Disallow the request if the origin is not allowed
    },
    credentials: true
  })
);

router.get('/api/hello', (ctx) => {
  ctx.body = 'Hello from Koa!';
});

router.get('/api/health', (ctx) => {
  ctx.body = { success: true };
  ctx.status = 200;
});

router.get('/api/random-number', (ctx) => {
  ctx.body = { number: randomIntFromInterval(1, 100) };
});

app.use(router.routes()).use(router.allowedMethods());
