import { prisma } from 'db';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .get(checkPageBounty);

async function checkPageBounty (req: NextApiRequest, res: NextApiResponse<boolean>) {
  const pageId = req.query.id as string;
  const pageBounty = await prisma.bounty.findFirst({
    where: {
      linkedTaskId: pageId
    }
  });

  return res.status(200).json(!!pageBounty);
}

export default withSessionRoute(handler);
