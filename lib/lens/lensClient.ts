import { LensClient, production, development } from '@lens-protocol/client';
import { polygon, polygonMumbai } from '@wagmi/core/chains';

import { isDevEnv } from 'config/constants';

const isServer = typeof window === 'undefined';

export const LensChain = /* isDevEnv ? polygonMumbai.id :  */ polygon.id;

const lensClient = new LensClient({
  environment: /* isDevEnv ? development :  */ production,
  storage: {
    // Need to bind the functions to the window.localStorage object otherwise it throws illegal invocation error
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
