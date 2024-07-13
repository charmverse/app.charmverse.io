'use client';

import env from '@beam-australia/react-env';
import type { LoggedInUser } from '@connect/lib/profile/interfaces';
import type { StatusAPIResponse as FarcasterBody } from '@farcaster/auth-kit';
import { GET } from '@root/adapters/http';

import type { FarcasterUser } from 'lib/farcaster/getFarcasterUsers';
import { encodeFilename } from 'lib/utils/encodeFilename';

import { HttpClient } from './HttpClient';

export class ConnectApiClient extends HttpClient {
  async loginViaFarcaster(req: FarcasterBody): Promise<LoggedInUser> {
    return this.POST('/api/session/login-with-farcaster', req);
  }

  async logout(): Promise<void> {
    return this.POST('/api/session/logout');
  }

  async uploadImage(file: File) {
    // Using 'this.GET' causes issue during upload
    // can't read property 'GET' of undefined
    return GET<{
      token: any;
      region: string;
      bucket: string;
      key: string;
    }>(`${env('CONNECT_API_HOST')}/api/image/upload`, {
      filename: encodeFilename(file.name)
    });
  }

  async getFarcasterUsersByUsername(username: string) {
    return this.GET<FarcasterUser[]>('/api/farcaster/get-by-username', {
      username
    });
  }
}
