
import { prisma } from 'db';
import { onError, onNoMatch, requireApiKey } from 'lib/middleware';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireApiKey)
  .get(test);

async function test (req: NextApiRequest, res: NextApiResponse) {

  return res.status(200).json({ success: true });
}

export default handler;
