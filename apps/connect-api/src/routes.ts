import Router from 'koa-router';

import router0 from './api/session/login-with-farcaster';

const rootRouter = new Router();

rootRouter.use(router0.routes(), router0.allowedMethods());

export default rootRouter;
