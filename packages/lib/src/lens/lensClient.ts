import { LensClient, production, development } from '@lens-protocol/client';
import { isProdEnv } from '@packages/config/constants';

const isServer = typeof window === 'undefined';

const lensClient = new LensClient({
  environment: isProdEnv ? production : development,
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
