import { GetFederationTokenCommand, STSClient } from '@aws-sdk/client-sts';
import { MissingDataError } from '@charmverse/core/errors';
import { awsS3Bucket as bucket } from '@root/config/constants';
import { getS3ClientConfig } from '@root/lib/aws/getS3ClientConfig';
import { getUserS3FilePath } from '@root/lib/aws/uploadToS3Server';
import { v4 as uuid } from 'uuid';

const uploadRegion = process.env.S3_UPLOAD_REGION;
const missingKeys: string[] = [];
if (!process.env.S3_UPLOAD_REGION) {
  missingKeys.push('S3_UPLOAD_REGION');
}
if (!bucket) {
  missingKeys.push('S3_UPLOAD_BUCKET');
}

// @ts-ignore
const validCharacters = /^[\000-\177]*$/;

export async function uploadToken(filename: string, userId: string) {
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
