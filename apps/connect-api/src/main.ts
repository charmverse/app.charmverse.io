import { log } from '@charmverse/core/log';
import cors from '@koa/cors';
import Koa from 'koa';
import Router from 'koa-router';

import { randomIntFromInterval } from 'lib/utils/random';

const app = new Koa();
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

const port = process.env.PORT || 3333;
const host = '0.0.0.0';

app.listen(typeof port === 'string' ? parseInt(port) : port, host, () => {
  log.info(`Builder API server is running on http://localhost:${port}`);
});
