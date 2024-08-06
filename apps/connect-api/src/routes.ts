/* eslint-disable import/no-extraneous-dependencies */
import Router from 'koa-router';

import router0 from './api/farcaster/get-by-username';
import router1 from './api/grants/list';
import router2 from './api/image/upload';
import router3 from './api/session/login-dev';
import router4 from './api/session/login-with-farcaster';
import router5 from './api/session/logout';

const rootRouter = new Router();

rootRouter.use(router0.routes(), router0.allowedMethods());
rootRouter.use(router1.routes(), router1.allowedMethods());
rootRouter.use(router2.routes(), router2.allowedMethods());
rootRouter.use(router3.routes(), router3.allowedMethods());
rootRouter.use(router4.routes(), router4.allowedMethods());
rootRouter.use(router5.routes(), router5.allowedMethods());

export default rootRouter;
