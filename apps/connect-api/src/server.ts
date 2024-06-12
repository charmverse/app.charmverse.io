import { log } from '@charmverse/core/log';
import cors from '@koa/cors';
import Koa from 'koa';
import Router from 'koa-router';

import { randomIntFromInterval } from 'lib/utils/random';

export const app = new Koa();
const router = new Router();

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

router.get('/api/hello', (ctx) => {
  ctx.body = 'Hello from Koa!';
});

router.get('/api/random-number', (ctx) => {
  ctx.body = { number: randomIntFromInterval(1, 100) };
});

app.use(router.routes()).use(router.allowedMethods());
