'use client';

import type { StatusAPIResponse as FarcasterBody } from '@farcaster/auth-kit';

import type { LoggedInUser } from 'models/index';

import { BaseConnectApiClient } from './baseConnectApiClient';

class ConnectApiClient extends BaseConnectApiClient {
  async loginViaFarcaster(req: FarcasterBody): Promise<LoggedInUser> {
    return this.POST('/api/session/login-with-farcaster', req);
  }
}

export const connectApiClient = new ConnectApiClient();
