import { LensClient, production, development } from '@lens-protocol/client';

import { isDevEnv } from 'config/constants';

const isServer = typeof window === 'undefined';

const lensClient = new LensClient({
  environment: isDevEnv ? development : production,
  storage: {
    getItem: isServer
      ? () => {
          return null;
        }
      : window.localStorage.getItem.bind(window.localStorage),
    removeItem: isServer ? () => {} : window.localStorage.removeItem.bind(window.localStorage),
    setItem: isServer ? () => {} : window.localStorage.setItem.bind(window.localStorage)
  }
});

export { lensClient };
