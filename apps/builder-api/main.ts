import { log } from '@charmverse/core/log';
import Koa from 'koa';
import Router from 'koa-router';

const app = new Koa();
const router = new Router();

router.get('/api/hello', (ctx) => {
  ctx.body = 'Hello from Koa!';
});

app.use(router.routes()).use(router.allowedMethods());

const port = 4000;

app.listen(port, () => {
  log.info(`Builder API server is running on http://localhost:${port}`);
});
