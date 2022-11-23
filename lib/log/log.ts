import logBase from 'loglevel';

import { apply } from './logLevel';

// Export the singleton instance
declare global {
  // eslint-disable-next-line no-var, vars-on-top
  var log: logBase.Logger;
}

export const log = global.log ?? apply(logBase.getLogger('default'));

// remember this instance of prisma in development to avoid too many clients
if (process.env.NODE_ENV === 'development') {
  global.log = log;
}
