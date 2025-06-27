import logBase from 'loglevel';

import { apply } from './logLevel';

// @ts-expect-error - dont mutate global for Node.js
export const log: logBase.Logger = globalThis.log ?? apply(logBase.getLogger('default'));

// remember this instance of prisma in development to avoid too many clients
if (process.env.NODE_ENV === 'development') {
  // @ts-expect-error
  globalThis.log = log;
}
