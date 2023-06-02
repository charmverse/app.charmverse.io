import type { ProposalPermissionFlags } from '@charmverse/core';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch } from 'lib/middleware';
import { getPermissionsClient } from 'lib/permissions/api';
import type { PermissionCompute } from 'lib/permissions/interfaces';
import { ProposalNotFoundError } from 'lib/proposal/errors';
import { withSessionRoute } from 'lib/session/withSession';
import { InvalidInputError } from 'lib/utilities/errors';
import { isUUID } from 'lib/utilities/strings';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.post(computePermissions);

async function computePermissions(req: NextApiRequest, res: NextApiResponse<ProposalPermissionFlags>) {
  const input = req.body as PermissionCompute;

  let resourceId = input.resourceId;

  if (!isUUID(input.resourceId)) {
    const [spaceDomain, proposalPath] = resourceId.split('/');
    if (!spaceDomain || !proposalPath) {
      throw new InvalidInputError(`Invalid proposal path and space domain`);
    }

    const proposal = await prisma.proposal.findFirst({
      where: {
        page: {
          path: proposalPath
        },
        space: {
          domain: spaceDomain
        }
      },
      select: {
        id: true
      }
    });

    if (!proposal) {
      throw new ProposalNotFoundError(resourceId);
    } else {
      resourceId = proposal.id;
    }
  }

  const permissions = await getPermissionsClient({ resourceId, resourceIdType: 'proposal' }).then(({ client }) =>
    client.proposals.computeProposalPermissions({
      resourceId,
      userId: req.session.user?.id
    })
  );
  res.status(200).json(permissions);
}

export default withSessionRoute(handler);
