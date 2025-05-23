import type { Space } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { updateTokenGateDetails } from '@packages/lib/blockchain/updateTokenGateDetails';
import { onError, onNoMatch, requireKeys, requireSpaceMembership } from '@packages/lib/middleware';
import requireValidation from '@packages/lib/middleware/requireValidation';
import { withSessionRoute } from '@packages/lib/session/withSession';
import type { TokenGateWithRoles } from '@packages/lib/tokenGates/interfaces';
import { processTokenGateConditions } from '@packages/lib/tokenGates/processTokenGateConditions';
import { trackUserAction } from '@packages/metrics/mixpanel/trackUserAction';
import { validateTokenGateRestrictions } from '@packages/subscriptions/featureRestrictions';
import { DataNotFoundError, InvalidInputError, SystemError } from '@packages/utils/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .get(getTokenGates)
  .use(requireKeys(['spaceId', 'conditions'], 'body'))
  .use(requireSpaceMembership({ adminOnly: true }))
  .use(requireValidation('tokenGateConditions'))
  .post(saveTokenGate);

async function saveTokenGate(req: NextApiRequest, res: NextApiResponse<void>) {
  const userId = req.session.user.id;
  const spaceId = req.body.spaceId;

  if (!spaceId) {
    throw new SystemError({
      message: 'Space ID is required',
      errorType: 'Invalid input',
      severity: 'warning'
    });
  }

  const [{ subscriptionTier }, existingTokenGates] = await Promise.all([
    prisma.space.findUniqueOrThrow({
      where: { id: spaceId },
      select: { subscriptionTier: true }
    }),
    prisma.tokenGate.count({ where: { spaceId } })
  ]);

  // Check token gate access restrictions
  await validateTokenGateRestrictions({
    subscriptionTier,
    existingTokenGates,
    conditions: req.body.conditions
  });

  const { numberOfConditions, chainType, accessType, gateType } = processTokenGateConditions(req.body);

  await prisma.tokenGate.create({
    data: {
      createdBy: req.session.user.id,
      resourceId: {},
      ...req.body
    }
  });

  trackUserAction('add_a_gate', {
    userId,
    spaceId,
    accessType,
    chainType,
    gateType,
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
  })) as any as TokenGateWithRoles[];

  const tokenGatesWithDetails = await updateTokenGateDetails(result);

  res.status(200).json(tokenGatesWithDetails);
}

export default withSessionRoute(handler);
