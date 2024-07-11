'use client';

import { GET } from '@root/adapters/http';
import { connectApiHost } from '@root/config/constants';
import type { FarcasterUser } from '@root/lib/farcaster/getFarcasterUsers';
import { encodeFilename } from '@root/lib/utils/encodeFilename';

export const apiClient = {
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
  },

  async getFarcasterUsersByUsername(username: string) {
    return GET<FarcasterUser[]>('/api/farcaster/get-by-username', {
      username
    });
  }
};
