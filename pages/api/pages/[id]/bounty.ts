import { prisma } from 'db';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .get(checkPageBounty);

// This endpoint is used to detect if a page has a bounty attached with it or not
// Its important as we don't fetch all bounties, only the ones the user has access to
// So the UI might be misleading in some circumstances where the bounty is actually present for a page but not fetched
async function checkPageBounty (req: NextApiRequest, res: NextApiResponse<boolean>) {
  const pageId = req.query.id as string;
  const pageBounty = await prisma.bounty.findFirst({
    where: {
      page: {
        id: pageId
      }
    }
  });

  return res.status(200).json(!!pageBounty);
}

export default withSessionRoute(handler);
