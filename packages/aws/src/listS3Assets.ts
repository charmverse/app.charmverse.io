import { ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import { awsS3Bucket } from '@packages/utils/constants';

import { getS3ClientConfig } from './getS3ClientConfig';

export async function listS3BucketContents({ prefix = '', delimiter }: { prefix?: string; delimiter?: string }) {
  const s3Client = new S3Client(getS3ClientConfig());

  const params = {
    Bucket: awsS3Bucket,
    Prefix: prefix,
    Delimiter: delimiter
  };

  const data = await s3Client.send(new ListObjectsV2Command(params));
  return data;
}

// listS3BucketContents({
//   delimiter: '',
//   prefix: 'spaces/1db2d7c4-4d10-447b-80a4-e8ec4504efb0/5f329117-c6ea-4d3a-a258-f37fa19a99e3'
// }).then((data) => console.log(data));
