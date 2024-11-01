// This code was copied from https://github.com/ryanto/next-s3-upload/blob/master/packages/next-s3-upload/src/hooks/use-s3-upload.tsx
// We can replace with the actual library once next-s3-upload updates their AWS-SDK dependency to V3
// see this issue for more: https://github.com/ryanto/next-s3-upload/issues/15
import type { PutObjectCommandInput } from '@aws-sdk/client-s3';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { v4 as uuid } from 'uuid';

import { getS3ClientConfig } from './getS3ClientConfig';

const client = new S3Client(getS3ClientConfig());

const awsS3Bucket = process.env.S3_UPLOAD_BUCKET as string;

export async function uploadFileToS3(file: { pathInS3: string; content: Buffer; contentType?: string }) {
  const params: PutObjectCommandInput = {
    ACL: 'public-read',
    Bucket: awsS3Bucket,
    Key: file.pathInS3,
    Body: file.content,
    ContentType: file.contentType
  };

  const s3Upload = new Upload({
    client,
    params
  });

  await s3Upload.done();

  const fileUrl = `https://s3.amazonaws.com/${awsS3Bucket}/${file.pathInS3}`;
  return { fileUrl };
}

export async function uploadUrlToS3({ pathInS3, url }: { pathInS3: string; url: string }) {
  const data = await fetch(url);
  const arrayBuffer = await data.arrayBuffer();

  const blob = Buffer.from(arrayBuffer);

  const { fileUrl } = await uploadFileToS3({
    pathInS3,
    content: blob,
    contentType: data.headers.get('content-type') || undefined
  });

  return { url: fileUrl };
}

function generateFilename(url: string) {
  // strip out url base
  const filename = url.includes('http') ? decodeURIComponent(new URL(url).pathname.split('/').pop() || '') : url;
  const sanitized = filename.replace(/\+/g, '_').replace(/\s/g, '-');
  return sanitized || uuid();
}

export function getFilePath({ spaceId, url }: { spaceId: string; url: string }) {
  return `spaces/${spaceId}/${uuid()}/${generateFilename(url)}`;
}

export function getUserS3FilePrefix({ userId }: { userId: string }) {
  return `user-content/${userId}`;
}

export function getUserS3FilePath({ userId, url }: { userId: string; url: string }) {
  return `${getUserS3FilePrefix({ userId })}/${uuid()}/${generateFilename(url)}`;
}

export function getFarcasterAppFilePath({ url }: { url: string }) {
  return `farcaster-app/${uuid()}/${generateFilename(url)}`;
}

export const getFilenameWithExtension = (path: string, fallbackExtension = 'jpg'): string => {
  const pathParts = path.split('/');
  const rawName = pathParts.pop() || '';
  const [name, extension] = rawName.split('.');

  return `${pathParts.join('/')}/${name}.${extension?.toLowerCase() || fallbackExtension}`;
};
