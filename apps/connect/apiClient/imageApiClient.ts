import { POST, GET, DELETE, PUT } from 'adapters/http';
import { baseUrl } from 'config/constants';
import { encodeFilename } from 'lib/utils/file';

import { BaseConnectApiClient } from './baseConnectApiClient';

export class ImageApiClient extends BaseConnectApiClient {
  async resize(formData: FormData) {
    return POST<{ url: string }>(`${baseUrl}/api/image/resize`, formData, {
      noHeaders: true,
      skipStringifying: true
    });
  }

  upload(file: File) {
    return GET<{
      token: any;
      region: string;
      bucket: string;
      key: string;
    }>(`${baseUrl}/api/aws/s3-upload`, {
      filename: encodeFilename(file.name)
    });
  }
}
