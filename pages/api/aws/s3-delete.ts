// based on example from https://github.com/ryanto/next-s3-upload/issues/13
import type { DeleteObjectCommandInput } from '@aws-sdk/client-s3';
import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).delete(deleteImage);

async function deleteImage (req: NextApiRequest, res: NextApiResponse) {

  const imageSrc = req.body.src;
  if (typeof imageSrc !== 'string') {
    return res.status(400).json({ error: 'src is required' });
  }

  const urlParts = new URL(imageSrc).pathname.split('/');
  urlParts.splice(0, 2); // remove bucket name
  const key = urlParts.join('/');

  const input: DeleteObjectCommandInput = {
    Bucket: process.env.S3_UPLOAD_BUCKET as string,
    Key: key
  };

  const client = new S3Client({
    credentials: {
      accessKeyId: process.env.S3_UPLOAD_KEY as string,
      secretAccessKey: process.env.S3_UPLOAD_SECRET as string
    },
    region: process.env.S3_UPLOAD_REGION
  });

  const command = new DeleteObjectCommand(input);
  await client.send(command);

  res.status(200).json({ ok: true });
}

export default withSessionRoute(handler);
