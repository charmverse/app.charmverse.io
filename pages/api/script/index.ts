
import { onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { migrateBountyReviewers } from 'scripts/migrateBountyReviewers';
import { prisma } from 'db';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .get(runCommand)
  .post(runCommand);

async function runCommand (req: NextApiRequest, res: NextApiResponse) {

  res.status(200).json({
    msg: 'hello'
  });
}

export default withSessionRoute(handler);
