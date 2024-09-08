import Router from '@koa/router';
import Koa from 'koa';

import * as routes from './routes';

const app = new Koa();
const router = new Router();

router.get('/', routes.healthCheck);
router.get('/api/health', routes.healthCheck);

app.use(routes.errorHandler).use(router.routes()).use(router.allowedMethods());

export default app;
