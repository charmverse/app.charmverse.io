import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireSpaceMembership } from 'lib/middleware';
import { requirePaidPermissionsSubscription } from 'lib/middleware/requirePaidPermissionsSubscription';
import { withSessionRoute } from 'lib/session/withSession';
import type { UpdateCustomDomainResponse } from 'lib/spaces/updateSpaceCustomDomain';
import { updateSpaceCustomDomain } from 'lib/spaces/updateSpaceCustomDomain';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireSpaceMembership({ adminOnly: true, spaceIdKey: 'id' }))
  .use(
    requirePaidPermissionsSubscription({
      key: 'id',
      resourceIdType: 'space'
    })
  )
  .put(updateCustomDomainHandler);

async function updateCustomDomainHandler(req: NextApiRequest, res: NextApiResponse<UpdateCustomDomainResponse>) {
  const spaceId = req.query.id as string;

  const updatedCustomDomain = await updateSpaceCustomDomain(spaceId, req.body);

  res.status(200).send(updatedCustomDomain);
}

export default withSessionRoute(handler);
