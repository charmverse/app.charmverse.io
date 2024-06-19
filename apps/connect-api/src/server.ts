import cors from '@koa/cors';
import Koa from 'koa';
import Router from 'koa-router';

import { isDevEnv, isTestEnv } from 'config/constants';
import { randomIntFromInterval } from 'lib/utils/random';

export const app = new Koa();
const router = new Router();

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

router.get('/api/hello', (ctx) => {
  ctx.body = 'Hello from Koa!';
});

router.get('/health-check', (ctx) => {
  ctx.body = { success: true };
  ctx.status = 200;
});

router.get('/api/random-number', (ctx) => {
  ctx.body = { number: randomIntFromInterval(1, 100) };
});

app.use(router.routes()).use(router.allowedMethods());
