'use client';

import { GET } from '@root/adapters/http';
import type { FarcasterUser } from '@root/lib/farcaster/getFarcasterUsers';
import { encodeFilename } from '@root/lib/utils/encodeFilename';

export const apiClient = {
  async getUploadToken(file: File) {
    return GET<{
      token: any;
      region: string;
      bucket: string;
      key: string;
    }>('/api/aws/upload-token', {
      filename: encodeFilename(file.name)
    });
  },

  async getFarcasterUsersByUsername(username: string) {
    return GET<FarcasterUser[]>('/api/farcaster/get-by-username', {
      username
    });
  }
};
