// This code was copied from https://github.com/ryanto/next-s3-upload/blob/master/packages/next-s3-upload/src/hooks/use-s3-upload.tsx
// We can replace with the actual library once next-s3-upload updates their AWS-SDK dependency to V3
// see this issue for more: https://github.com/ryanto/next-s3-upload/issues/15
import type { PutObjectCommandInput } from '@aws-sdk/client-s3';

type Config = {
  onUploadPercentageProgress?: (progress: number) => void;
};

export async function uploadToS3(
  getUploadToken: (file: File) => Promise<{
    token: any;
    bucket: string;
    key: string;
    region: string;
  }>,
  file: File,
  config?: Config
) {
  const data = await getUploadToken(file); // retrieve a token to upload to s3
  const trackProgress = !!config?.onUploadPercentageProgress;

  const { S3Client } = await import('@aws-sdk/client-s3');
  const { Upload } = await import('@aws-sdk/lib-storage');
  const { XhrHttpHandler } = await import('@aws-sdk/xhr-http-handler');

  const client = new S3Client({
    credentials: {
      accessKeyId: data.token.Credentials.AccessKeyId,
      secretAccessKey: data.token.Credentials.SecretAccessKey,
      sessionToken: data.token.Credentials.SessionToken
    },
    region: data.region,

    requestHandler: trackProgress ? new XhrHttpHandler() : undefined
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

  s3Upload.on('httpUploadProgress', ({ loaded, total }) => {
    if (loaded && total) {
      const progressPercentage = Math.min(Math.round((loaded / total) * 100), 100);
      config?.onUploadPercentageProgress?.(progressPercentage);
    }
  });

  await s3Upload.done();

  const location = `https://s3.amazonaws.com/${data.bucket}/${data.key}`;

  return {
    url: location,
    bucket: data.bucket,
    key: data.key
  };
}
