import { GetFederationTokenCommand, STSClient } from '@aws-sdk/client-sts';
import { MissingDataError } from '@charmverse/core/errors';
import { getS3ClientConfig } from '@packages/aws/getS3ClientConfig';
import { getFarcasterAppFilePath } from '@packages/aws/uploadToS3Server';
import { awsS3Bucket as bucket } from '@packages/utils/constants';
import { v4 as uuid } from 'uuid';

const missingKeys: string[] = [];
if (!process.env.S3_UPLOAD_REGION) {
  missingKeys.push('S3_UPLOAD_REGION');
}
if (!bucket) {
  missingKeys.push('S3_UPLOAD_BUCKET');
}

const validCharacters = /^[\000-\177]*$/;

export async function uploadToken(filename: string) {
  if (missingKeys.length > 0) {
    throw new MissingDataError(`S3 Upload: Missing ENVs ${missingKeys.join(', ')}`);
  }

  if (!validCharacters.test(filename)) {
    const extension = filename.split('.').at(-1);
    const randomName = uuid();
    filename = `${randomName}.${extension}`;
  }

  const key = getFarcasterAppFilePath({ url: decodeURIComponent(filename) });

  const policy = {
    Statement: [
      {
        Sid: 'Stmt1S3UploadAssets',
        Effect: 'Allow',
        Action: ['s3:PutObject', 's3:PutObjectAcl'],
        Resource: [`arn:aws:s3:::${bucket}/${key}`]
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
    bucket,
    region: process.env.S3_UPLOAD_REGION
  };
}
