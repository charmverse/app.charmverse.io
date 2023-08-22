import { LensClient, production, development } from '@lens-protocol/client';

import { isDevEnv } from 'config/constants';

const lensClient = new LensClient({
  environment: isDevEnv ? development : production
});

export { lensClient };
