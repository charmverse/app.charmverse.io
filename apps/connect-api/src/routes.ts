
import Router from 'koa-router';

import router0 from './api/farcaster/get-by-username';
import router1 from './api/image/upload';
import router2 from './api/session/login-with-farcaster';

const rootRouter = new Router();

rootRouter.use(router0.routes(), router0.allowedMethods());
rootRouter.use(router1.routes(), router1.allowedMethods());
rootRouter.use(router2.routes(), router2.allowedMethods());

export default rootRouter;
  