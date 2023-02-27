import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { onError, onNoMatch, requireKeys } from 'lib/middleware';
import type { PermissionCompute } from 'lib/permissions/interfaces';
import type { IPagePermissionFlags } from 'lib/permissions/pages';
import { computeUserPagePermissions } from 'lib/permissions/pages';
import { ProposalNotFoundError } from 'lib/proposal/errors';
import { withSessionRoute } from 'lib/session/withSession';
import { InvalidInputError } from 'lib/utilities/errors';
import { isUUID } from 'lib/utilities/strings';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireKeys<PermissionCompute>(['resourceId'], 'body')).post(computePagePermissions);

async function computePagePermissions(req: NextApiRequest, res: NextApiResponse<IPagePermissionFlags>) {
  const input = req.body as PermissionCompute;

  let resourceId = input.resourceId;

  if (!isUUID(input.resourceId)) {
    const [spaceDomain, proposalPath] = resourceId.split('/');
    if (!spaceDomain || !proposalPath) {
      throw new InvalidInputError(`Invalid proposal path and space domain`);
    }

    const proposal = await prisma.page.findFirst({
      where: {
        path: proposalPath,
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

  const permissions = await computeUserPagePermissions({
    pageId: resourceId,
    userId: req.session.user?.id
  });
  res.status(200).json(permissions);
}

export default withSessionRoute(handler);
