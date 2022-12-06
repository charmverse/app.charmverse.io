import type { STSClientConfig } from '@aws-sdk/client-sts';

export function getS3ClientConfig() {
  const config: STSClientConfig = {
    region: process.env.S3_UPLOAD_REGION
  };

  if (process.env.S3_UPLOAD_KEY && process.env.S3_UPLOAD_SECRET) {
    config.credentials = {
      accessKeyId: process.env.S3_UPLOAD_KEY as string,
      secretAccessKey: process.env.S3_UPLOAD_SECRET as string
    };
  }
  return config;
}
