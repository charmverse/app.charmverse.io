import Router from 'koa-router';

import router0 from './api/random-number';
import router1 from './api/session/login';

const rootRouter = new Router();

rootRouter.use(router0.routes(), router0.allowedMethods());
rootRouter.use(router1.routes(), router1.allowedMethods());

export default rootRouter;