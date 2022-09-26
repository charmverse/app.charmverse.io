// This code was copied from https://github.com/ryanto/next-s3-upload/blob/master/packages/next-s3-upload/src/hooks/use-s3-upload.tsx
// We can replace with the actual library once next-s3-upload updates their AWS-SDK dependency to V3
// see this issue for more: https://github.com/ryanto/next-s3-upload/issues/15
import type { PutObjectCommandInput } from '@aws-sdk/client-s3';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import fetch from 'node-fetch';
import { v4 as uuid } from 'uuid';

const client = new S3Client({
  credentials: {
    accessKeyId: process.env.S3_UPLOAD_KEY as string,
    secretAccessKey: process.env.S3_UPLOAD_SECRET as string
  },
  region: process.env.S3_UPLOAD_REGION
});

export async function uploadToS3 ({ fileName, url }: { fileName: string; url: string; }) {

  const bucket = process.env.S3_UPLOAD_BUCKET;

  const data = await fetch(url);
  const blob = await data.buffer();

  const params: PutObjectCommandInput = {
    ACL: 'public-read',
    Bucket: bucket,
    Key: fileName,
    Body: blob
  };

  const s3Upload = new Upload({
    client,
    params
  });

  await s3Upload.done();
  const location = `https://s3.amazonaws.com/${bucket}/${fileName}`;
  return {
    url: location
  };
}

function generateFilename (url: string) {
  return decodeURIComponent(new URL(url).pathname.split('/').pop() || '')?.replace(/\s/g, '-') || uuid();
}

export function getFilePath ({ spaceId, url }: { spaceId: string; url: string; }) {
  return `spaces/${spaceId}/${uuid()}/${generateFilename(url)}`;
}

export function getUserS3Folder ({ userId, url }: { userId: string; url: string; }) {
  return `user-content/${userId}/${uuid()}/${generateFilename(url)}`;
}
