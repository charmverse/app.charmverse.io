import type { Space } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { updateTokenGatesDetails } from 'lib/blockchain/updateTokenGateDetails';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { onError, onNoMatch, requireKeys, requireSpaceMembership } from 'lib/middleware';
import requireValidation from 'lib/middleware/requireValidation';
import { withSessionRoute } from 'lib/session/withSession';
import { addDaylightAbility } from 'lib/tokenGates/daylight';
import type { TokenGate, TokenGateWithRoles } from 'lib/tokenGates/interfaces';
import { processTokenGateConditions } from 'lib/tokenGates/processTokenGateConditions';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';
import { DataNotFoundError, InvalidInputError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .get(getTokenGates)
  .use(requireKeys(['spaceId', 'type', 'conditions'], 'body'))
  .use(requireSpaceMembership({ adminOnly: true }))
  .use(requireValidation('tokenGateConditions'))
  .post(saveTokenGate);

async function saveTokenGate(req: NextApiRequest, res: NextApiResponse<void>) {
  const userId = req.session.user.id;
  const spaceId = req.body.spaceId;

  const { error } = await hasAccessToSpace({
    userId,
    spaceId,
    adminOnly: true
  });
  if (error) {
    throw error;
  }

  const { accessTypes, numberOfConditions, chainType, accesType } = processTokenGateConditions(req.body);

  const result = (await prisma.tokenGate.create({
    data: {
      createdBy: req.session.user.id,
      ...req.body,
      accessTypes
    }
  })) as TokenGate;

  addDaylightAbility(result);
  trackUserAction('add_a_gate', {
    userId,
    spaceId,
    accesType,
    chainType,
    gateType: result.type,
    numberOfConditions
  });

  res.status(200).end();
}

async function getTokenGates(req: NextApiRequest, res: NextApiResponse<TokenGateWithRoles[]>) {
  let space: Pick<Space, 'id'> | null = null;

  const { spaceDomain } = req.query;

  // Get space id using the domain
  if (spaceDomain) {
    space = await prisma.space.findFirst({
      where: {
        domain: req.query.spaceDomain as string
      },
      select: {
        id: true
      }
    });
    if (!space) {
      throw new DataNotFoundError(`Space with domain ${spaceDomain}`);
    }
  }

  const spaceId = space?.id || (req.query.spaceId as string);

  if (!spaceId) {
    throw new InvalidInputError('spaceId is required');
  }

  const result = (await prisma.tokenGate.findMany({
    where: {
      spaceId
    },
    include: {
      tokenGateToRoles: {
        include: {
          role: true
        }
      }
    }
  })) as TokenGateWithRoles[];

  const tokenGatesWithDetails = await updateTokenGatesDetails(result);

  res.status(200).json(tokenGatesWithDetails);
}

export default withSessionRoute(handler);
