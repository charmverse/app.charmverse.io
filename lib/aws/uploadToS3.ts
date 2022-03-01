// This code was copied from https://github.com/ryanto/next-s3-upload/blob/master/packages/next-s3-upload/src/hooks/use-s3-upload.tsx
// We can replace with the actual library once next-s3-upload updates their AWS-SDK dependency to V3
// see this issue for more: https://github.com/ryanto/next-s3-upload/issues/15
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

export const uploadToS3 = async (file: File) => {
  const filename = encodeURIComponent(file.name);
  const res = await fetch(`/api/aws/s3-upload?filename=${filename}`);
  const data = await res.json();

  if (data.error) {
    console.error(data.error);
    throw data.error;
  }
  else {
    const client = new S3Client({
      credentials: {
        accessKeyId: data.token.Credentials.AccessKeyId,
        secretAccessKey: data.token.Credentials.SecretAccessKey,
        sessionToken: data.token.Credentials.SessionToken
      },
      region: data.region
    });

    const params = {
      ACL: 'public-read',
      Bucket: data.bucket,
      Key: data.key,
      Body: file,
      CacheControl: 'max-age=630720000, public',
      ContentType: file.type
    };

    // at some point make this configurable
    // let uploadOptions = {
    //   partSize: 100 * 1024 * 1024,
    //   queueSize: 1,
    // };

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
};
