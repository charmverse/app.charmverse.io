import type { SpaceRequireProposalTemplateToggle } from '@charmverse/core/permissions';
import type { Space } from '@charmverse/core/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireSpaceMembership, requireUser } from 'lib/middleware';
import { providePermissionClients } from 'lib/permissions/api/permissionsClientMiddleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(
    providePermissionClients({
      key: 'id',
      location: 'query',
      resourceIdType: 'space'
    })
  )
  .use(
    requireSpaceMembership({
      spaceIdKey: 'id',
      adminOnly: true
    })
  )
  .post(setRequireProposalTemplate);

async function setRequireProposalTemplate(req: NextApiRequest, res: NextApiResponse<Space>) {
  const { id: spaceId } = req.query;
  const { requireProposalTemplate } = req.body as Pick<SpaceRequireProposalTemplateToggle, 'requireProposalTemplate'>;

  const updatedSpace = await req.premiumPermissionsClient.spaces.toggleRequireProposalTemplate({
    requireProposalTemplate,
    spaceId: spaceId as string
  });

  return res.status(200).json(updatedSpace);
}

export default withSessionRoute(handler);
