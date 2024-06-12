import { log } from '@charmverse/core/log';
import Koa from 'koa';
import Router from 'koa-router';

import { randomIntFromInterval } from 'lib/utils/random';

const app = new Koa();
const router = new Router();

router.get('/api/hello', (ctx) => {
  ctx.body = 'Hello from Koa!';
});

router.get('/api/random-number', (ctx) => {
  ctx.body = { number: randomIntFromInterval(1, 100) };
});

app.use(router.routes()).use(router.allowedMethods());

const port = process.env.PORT || 4000;

app.listen(port, () => {
  log.info(`Builder API server is running on http://localhost:${port}`);
});
