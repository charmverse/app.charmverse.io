import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { requirePaidPermissionsSubscription } from 'lib/middleware/requirePaidPermissionsSubscription';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(
    requirePaidPermissionsSubscription({
      key: 'id',
      location: 'query',
      resourceIdType: 'bounty'
    })
  )
  .get(isRewardEditable);

async function isRewardEditable(req: NextApiRequest, res: NextApiResponse<{ editable: boolean }>) {
  const { id: bountyId } = req.query;

  const result = await req.premiumPermissionsClient.pages.isBountyPageEditableByApplicants({
    resourceId: bountyId as string
  });

  res.status(200).send(result);
}

export default withSessionRoute(handler);
