'use client';

import type { StatusAPIResponse as FarcasterBody } from '@farcaster/auth-kit';

import { encodeFilename } from 'lib/utils/encodeFilename';
import type { LoggedInUser } from 'models/index';

import { BaseConnectApiClient } from './baseConnectApiClient';

class ConnectApiClient extends BaseConnectApiClient {
  async loginViaFarcaster(req: FarcasterBody): Promise<LoggedInUser> {
    return this.POST('/api/session/login-with-farcaster', req);
  }

  async uploadImage(file: File) {
    return this.GET<{
      token: any;
      region: string;
      bucket: string;
      key: string;
    }>(`/api/image/upload`, {
      filename: encodeFilename(file.name)
    });
  }
}

export const connectApiClient = new ConnectApiClient();
