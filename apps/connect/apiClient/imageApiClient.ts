import { encodeFilename } from 'lib/utils/file';

import { BaseConnectApiClient } from './baseConnectApiClient';

export class ImageApiClient extends BaseConnectApiClient {
  upload(file: File) {
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
