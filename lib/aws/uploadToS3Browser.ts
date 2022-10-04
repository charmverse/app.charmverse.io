// This code was copied from https://github.com/ryanto/next-s3-upload/blob/master/packages/next-s3-upload/src/hooks/use-s3-upload.tsx
// We can replace with the actual library once next-s3-upload updates their AWS-SDK dependency to V3
// see this issue for more: https://github.com/ryanto/next-s3-upload/issues/15
import type { PutObjectCommandInput } from '@aws-sdk/client-s3';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

import charmClient from 'charmClient';

export async function uploadToS3 (file: File) {
  const data = await charmClient.uploadToS3(file);

  const client = new S3Client({
    credentials: {
      accessKeyId: data.token.Credentials.AccessKeyId,
      secretAccessKey: data.token.Credentials.SecretAccessKey,
      sessionToken: data.token.Credentials.SessionToken
    },
    region: data.region
  });

  const params: PutObjectCommandInput = {
    ACL: 'public-read',
    Bucket: data.bucket,
    Key: data.key,
    Body: file,
    CacheControl: 'max-age=630720000, public',
    ContentType: file.type
  };

  const s3Upload = new Upload({
    client,
    params
  });

  await s3Upload.done();
  const location = `https://s3.amazonaws.com/${data.bucket}/${data.key}`;

  return {
    url: location,
    bucket: data.bucket,
    key: data.key
  };
}
