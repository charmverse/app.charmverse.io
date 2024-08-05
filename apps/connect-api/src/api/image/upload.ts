import { STSClient, GetFederationTokenCommand } from '@aws-sdk/client-sts';
import { PathBasedRouter } from '@connect-api/lib/pathBasedRouter';
import { awsS3Bucket } from '@root/config/constants';
import { getS3ClientConfig } from '@root/lib/aws/getS3ClientConfig';
import { getUserS3FilePath } from '@root/lib/aws/uploadToS3Server';
import type { SessionData } from '@root/lib/session/config';
import { getIronOptions } from '@root/lib/session/getIronOptions';
import Cookies from 'cookies';
import { getIronSession } from 'iron-session';
import type Router from 'koa-router';
import { v4 as uuid } from 'uuid';

const router = new PathBasedRouter();

const missingEnvs = (): string[] => {
  const keys: string[] = [];
  if (!process.env.S3_UPLOAD_REGION) {
    keys.push('S3_UPLOAD_REGION');
  }
  if (!awsS3Bucket) {
    keys.push('S3_UPLOAD_BUCKET');
  }
  return keys;
};

// Add the route to your Koa router
router.GET(async (ctx: Router.RouterContext) => {
  const missing = missingEnvs();
  const cookies = new Cookies(ctx.req, ctx.res);
  const session = await getIronSession<SessionData>(
    {
      get(name) {
        return {
          name,
          value: cookies.get(name) as string
        };
      },
      set: (nameOrOptions: any, value?: string, cookie?: Partial<any>) => {
        if (typeof nameOrOptions === 'string' && value !== undefined) {
          // When name and value are provided directly
          cookies.set(nameOrOptions, value, cookie);
        } else if (typeof nameOrOptions !== 'string') {
          // When an object is provided, assuming it has 'name' and 'value' keys at minimum
          const { name, value: _value, ...rest } = nameOrOptions;
          if (name && _value) {
            cookies.set(name, _value, rest);
          }
        }
      }
    },
    getIronOptions()
  );

  if (missing.length > 0) {
    ctx.status = 500;
    ctx.body = { error: `S3 Upload: Missing ENVs ${missing.join(', ')}` };
    return;
  }

  const userId = session.user?.id;
  const bucket = awsS3Bucket;

  if (!userId) {
    ctx.status = 401;
    ctx.body = { error: 'Unauthorized' };
    return;
  }

  let filename = decodeURIComponent(ctx.query.filename as string);
  const validCharacters = /^[\000-\177]*$/;

  if (!validCharacters.test(filename)) {
    const extension = filename.split('.').at(-1);
    const randomName = uuid();
    filename = `${randomName}.${extension}`;
  }

  const key = getUserS3FilePath({ userId, url: filename });

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

    ctx.status = 200;
    ctx.body = {
      token,
      key,
      bucket,
      region: process.env.S3_UPLOAD_REGION
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: 'Failed to generate S3 upload token' };
  }
});

export default router;
