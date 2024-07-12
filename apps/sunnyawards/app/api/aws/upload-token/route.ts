import { STSClient, GetFederationTokenCommand } from '@aws-sdk/client-sts';
import { awsS3Bucket } from '@root/config/constants';
import { getS3ClientConfig } from '@root/lib/aws/getS3ClientConfig';
import { getUserS3FilePath } from '@root/lib/aws/uploadToS3Server';
import type { SessionData } from '@root/lib/session/config';
import { getIronOptions } from '@root/lib/session/getIronOptions';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { v4 as uuid } from 'uuid';

const missingKeys: string[] = [];
if (!process.env.S3_UPLOAD_REGION) {
  missingKeys.push('S3_UPLOAD_REGION');
}
if (!awsS3Bucket) {
  missingKeys.push('S3_UPLOAD_BUCKET');
}

const validCharacters = /^[\000-\177]*$/;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  let filename = searchParams.get('filename');
  const session = await getIronSession<SessionData>(cookies(), getIronOptions());
  const userId = session.user?.id;

  if (!userId) {
    return new Response(`Unauthorized`, { status: 401 });
  }
  if (typeof filename !== 'string') {
    return new Response('username is required', { status: 400 });
  }
  if (missingKeys.length > 0) {
    return new Response(`S3 Upload: Missing ENVs ${missingKeys.join(', ')}`, { status: 500 });
  }

  const bucket = awsS3Bucket;

  if (!validCharacters.test(filename)) {
    const extension = filename.split('.').at(-1);
    const randomName = uuid();
    filename = `${randomName}.${extension}`;
  }

  const key = getUserS3FilePath({ userId, url: decodeURIComponent(filename) });

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

  try {
    const token = await sts.send(command);
    return Response.json({
      token,
      key,
      bucket,
      region: process.env.S3_UPLOAD_REGION
    });
  } catch (error) {
    return new Response(`Failed to generate S3 upload token: ${error}`, { status: 500 });
  }
}
