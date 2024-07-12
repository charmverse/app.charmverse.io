import { authSecret as _maybeAuthSecret, isTestEnv } from '@root/config/constants';

if (!_maybeAuthSecret && !isTestEnv) {
  throw new Error('The AUTH_SECRET env var is required to start server');
}

export const authSecret = _maybeAuthSecret as string;
