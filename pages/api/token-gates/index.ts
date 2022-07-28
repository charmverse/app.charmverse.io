
import { Space } from '@prisma/client';
import { prisma } from 'db';
import { hasAccessToSpace, onError, onNoMatch, requireSpaceMembership } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { TokenGateWithRoles } from 'lib/token-gates/interfaces';
import { DataNotFoundError, InvalidInputError } from 'lib/utilities/errors';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .get(getTokenGates)
  .use(requireSpaceMembership({ adminOnly: true }))
  .post(saveTokenGate);

async function saveTokenGate (req: NextApiRequest, res: NextApiResponse) {

  const { error } = await hasAccessToSpace({
    userId: req.session.user.id,
    spaceId: req.body.spaceId,
    adminOnly: true
  });
  if (error) {
    throw error;
  }

  const result = await prisma.tokenGate.create({
    data: {
      createdBy: req.session.user.id,
      ...req.body
    }
  });

  res.status(200).json(result);
}

async function getTokenGates (req: NextApiRequest, res: NextApiResponse<TokenGateWithRoles[]>) {

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

  const spaceId = space?.id || req.query.spaceId as string;

  if (!spaceId) {
    throw new InvalidInputError('spaceId is required');
  }

  const result = await prisma.tokenGate.findMany({
    where: {
      spaceId
    },
    include: {
      space: true,
      tokenGateToRoles: {
        include: {
          role: true
        }
      }
    }
  });

  res.status(200).json(result);
}

export default withSessionRoute(handler);
