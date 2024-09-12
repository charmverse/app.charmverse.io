import { log } from '@charmverse/core/log';
import Router from '@koa/router';
import Koa from 'koa';

import * as middleware from './middleware';
import { sendNotifications } from './tasks/pushNotifications/sendNotifications';

const app = new Koa();
const router = new Router();

router.get('/hello-world', (ctx) => {
  log.info('Hello World triggered', { body: ctx.body, headers: ctx.headers });

  ctx.body = 'hello world';
});

router.get('/api/health', middleware.healthCheck);

router.get('/send-push-notifications', async (ctx) => {
  log.info('Send push notifications triggered', { body: ctx.body, headers: ctx.headers });

  await sendNotifications();

  log.info('Send push notifications completed');

  ctx.body = 'hello world';
});

app.use(middleware.errorHandler).use(router.routes()).use(router.allowedMethods());

export default app;
