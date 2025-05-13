import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireSpaceMembership } from '@packages/lib/middleware';
import { requirePaidPermissionsSubscription } from '@packages/lib/middleware/requirePaidPermissionsSubscription';
import { withSessionRoute } from '@packages/lib/session/withSession';
import type { CustomDomainVerification } from 'lib/spaces/interfaces';
import type { UpdateCustomDomainResponse } from 'lib/spaces/updateSpaceCustomDomain';
import { updateSpaceCustomDomain } from 'lib/spaces/updateSpaceCustomDomain';
import { verifyCustomDomainConfig } from 'lib/spaces/verifyCustomDomainConfig';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireSpaceMembership({ adminOnly: true, spaceIdKey: 'id' }))
  .use(
    requirePaidPermissionsSubscription({
      key: 'id',
      resourceIdType: 'space'
    })
  )
  .put(updateCustomDomainHandler)
  .get(verifyCustomDomainHandler);

async function updateCustomDomainHandler(req: NextApiRequest, res: NextApiResponse<UpdateCustomDomainResponse>) {
  const spaceId = req.query.id as string;

  const updatedCustomDomain = await updateSpaceCustomDomain(spaceId, req.body);

  res.status(200).send(updatedCustomDomain);
}

async function verifyCustomDomainHandler(req: NextApiRequest, res: NextApiResponse<CustomDomainVerification>) {
  const spaceId = req.query.id as string;

  const customDomainVerificationResult = await verifyCustomDomainConfig(spaceId);

  res.status(200).send(customDomainVerificationResult);
}

export default withSessionRoute(handler);
