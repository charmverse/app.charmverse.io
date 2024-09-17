import { log } from '@charmverse/core/log';
import Router from '@koa/router';
import Koa from 'koa';

import * as middleware from './middleware';
import { processPullRequests } from './tasks/processPullRequests';
import { sendNotifications } from './tasks/pushNotifications/sendNotifications';

const app = new Koa();
const router = new Router();

// add a task endpoint which will be configured in cron.yml
function addTask(path: string, handler: (ctx: Koa.DefaultContext) => any) {
  router.post(path, async (ctx) => {
    log.info(`${path} triggered`, { body: ctx.body, headers: ctx.headers });

    const result = await handler(ctx);

    log.info(`${path} completed`);

    ctx.body = result || { success: true };
  });
}

addTask('/hello-world', (ctx) => {
  log.info('Hello World triggered', { body: ctx.body, headers: ctx.headers });
});

addTask('/process-pull-requests', processPullRequests);

addTask('/send-push-notifications', sendNotifications);

// Standard health check used by Beanstalk
router.get('/api/health', middleware.healthCheck);

app.use(middleware.errorHandler).use(router.routes()).use(router.allowedMethods());

export default app;
