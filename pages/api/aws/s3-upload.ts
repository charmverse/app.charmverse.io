// This file was copied with no changes from https://github.com/ryanto/next-s3-upload/blob/master/packages/next-s3-upload/src/hooks/use-s3-upload.tsx
// We can replace with the actual library once next-s3-upload updates their AWS-SDK dependency to V3
// see this issue for more: https://github.com/ryanto/next-s3-upload/issues/15

import { GetFederationTokenCommand, STSClient } from '@aws-sdk/client-sts';
import { awsS3Bucket } from '@root/config/constants';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { v4 as uuid } from 'uuid';

import { getS3ClientConfig } from 'lib/aws/getS3ClientConfig';
import { getUserS3FilePath } from 'lib/aws/uploadToS3Server';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

type NextRouteHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<void>;

// eslint-disable-next-line no-use-before-define
type Configure = (options: Options) => Handler;
type Handler = NextRouteHandler & { configure: Configure };

type Options = {
  key?: (req: NextApiRequest, filename: string) => string | Promise<string>;
};

const makeRouteHandler = (options: Options = {}): Handler => {
  const route: NextRouteHandler = async function routeRequest(req, res) {
    // eslint-disable-next-line no-use-before-define
    const missing = missingEnvs();

    const userId = req.session.user.id;
    if (missing.length > 0) {
      res.status(500).json({ error: `Next S3 Upload: Missing ENVs ${missing.join(', ')}` });
    } else {
      const bucket = awsS3Bucket;

      let filename = decodeURIComponent(req.query.filename as string);
      // @ts-ignore
      const validCharacters = /^[\000-\177]*$/;

      if (!validCharacters.test(filename)) {
        const extension = filename.split('.').at(-1);
        const randomName = uuid();
        filename = `${randomName}.${extension}`;
      }

      const key = options.key
        ? await Promise.resolve(options.key(req, filename))
        : getUserS3FilePath({ userId, url: filename });

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

      res.statusCode = 200;

      res.status(200).json({
        token,
        key,
        bucket,
        region: process.env.S3_UPLOAD_REGION
      });
    }
  };

  const configure = (_options: Options) => makeRouteHandler(_options);

  return Object.assign(route, { configure });
};

// This code checks the for missing env vars that this
// API route needs.
//
// Why does this code look like this? See this issue!
// https://github.com/ryanto/next-s3-upload/issues/50
//
let missingEnvs = (): string[] => {
  const keys = [];
  if (!process.env.S3_UPLOAD_REGION) {
    keys.push('S3_UPLOAD_REGION');
  }
  if (!awsS3Bucket) {
    keys.push('S3_UPLOAD_BUCKET');
  }
  return keys;
};

const APIRoute = makeRouteHandler();

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });
handler.use(requireUser).get(APIRoute);

export default withSessionRoute(handler);
