import { GetFederationTokenCommand, STSClient } from '@aws-sdk/client-sts';
import { MissingDataError } from '@charmverse/core/errors';
import { v4 as uuid } from 'uuid';

import { getS3ClientConfig } from './getS3ClientConfig';
import { getUserS3FilePath } from './uploadToS3Server';

const uploadRegion = process.env.S3_UPLOAD_REGION as string;
const s3bucket = process.env.S3_UPLOAD_BUCKET as string;

// @ts-ignore
const validCharacters = /^[\000-\177]*$/;

export async function uploadToken({ filename, userId }: { filename: string; userId: string }) {
  const missingKeys: string[] = [];
  if (!uploadRegion) {
    missingKeys.push('S3_UPLOAD_REGION');
  }
  if (!s3bucket) {
    missingKeys.push('S3_UPLOAD_BUCKET');
  }
  if (missingKeys.length > 0) {
    throw new MissingDataError(`S3 Upload: Missing ENVs ${missingKeys.join(', ')}`);
  }
  let parsedFilename = decodeURIComponent(filename);

  if (!validCharacters.test(parsedFilename)) {
    const extension = parsedFilename.split('.').at(-1);
    const randomName = uuid();
    parsedFilename = `${randomName}.${extension}`;
  }

  const key = getUserS3FilePath({ userId, url: parsedFilename });

  const policy = {
    Statement: [
      {
        Sid: 'Stmt1S3UploadAssets',
        Effect: 'Allow',
        Action: ['s3:PutObject', 's3:PutObjectAcl'],
        Resource: [`arn:aws:s3:::${s3bucket}/${key}`]
      }
    ]
  };

  const sts = new STSClient(getS3ClientConfig());

  const command = new GetFederationTokenCommand({
    Name: 'S3UploadWebToken',
    Policy: JSON.stringify(policy),
    DurationSeconds: 60 * 60 // 1 hour
  });

  const token = await sts.send(command);

  return {
    token,
    key,
    bucket: s3bucket,
    region: uploadRegion
  };
}
