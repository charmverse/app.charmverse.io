import Router from '@koa/router';
import Koa from 'koa';

import * as routes from './routes';

const app = new Koa();
const router = new Router();

router.get('/', routes.healthCheck);
router.get('/health_check', routes.healthCheck);

// TODO: Remove this route before merging to master
router.get('/kill-me', (ctx) => {
  setTimeout(() => {
    throw new Error('Killed by /kill-me');
  }, 1000);
  ctx.body = 'I shot the sheriff, but I did not shoot the deputy.';
});

app.use(routes.errorHandler).use(router.routes()).use(router.allowedMethods());

export default app;
