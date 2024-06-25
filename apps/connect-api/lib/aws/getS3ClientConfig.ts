import type { STSClientConfig } from '@aws-sdk/client-sts';

import { S3_UPLOAD_KEY, S3_UPLOAD_SECRET } from '../../src/constants';

export function getS3ClientConfig() {
  const config: STSClientConfig = {
    region: process.env.S3_UPLOAD_REGION
  };

  if (S3_UPLOAD_KEY && S3_UPLOAD_SECRET) {
    config.credentials = {
      accessKeyId: S3_UPLOAD_KEY,
      secretAccessKey: S3_UPLOAD_SECRET
    };
  }
  return config;
}
