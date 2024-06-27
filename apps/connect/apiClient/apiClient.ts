'use client';

import type { StatusAPIResponse as FarcasterBody } from '@farcaster/auth-kit';

import { GET } from 'adapters/http';
import { connectApiHost } from 'config/constants';
import { encodeFilename } from 'lib/utils/encodeFilename';
import type { LoggedInUser } from 'models/index';

import { HttpClient } from './HttpClient';

class ConnectApiClient extends HttpClient {
  async loginViaFarcaster(req: FarcasterBody): Promise<LoggedInUser> {
    return this.POST('/api/session/login-with-farcaster', req);
  }

  async uploadImage(file: File) {
    // Using 'this.GET' causes issue during upload
    // can't read property 'GET' of undefined
    return GET<{
      token: any;
      region: string;
      bucket: string;
      key: string;
    }>(`${connectApiHost}/api/image/upload`, {
      filename: encodeFilename(file.name)
    });
  }
}

export const connectApiClient = new ConnectApiClient();
