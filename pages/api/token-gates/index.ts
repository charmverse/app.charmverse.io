
import { Role, Space, TokenGate, TokenGateToRole } from '@prisma/client';
import { prisma } from 'db';
import { hasAccessToSpace, onError, onNoMatch, requireSpaceMembership } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
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

export interface GetTokenGatesResponse extends TokenGate {
  space: Space;
  tokenGateToRoles: (TokenGateToRole & {
      role: Role;
  })[];
}

async function getTokenGates (req: NextApiRequest, res: NextApiResponse<GetTokenGatesResponse[] | { error: string }>) {

  let space: Space | null = null;
  if (req.query.spaceDomain) {
    space = await prisma.space.findFirst({
      where: {
        domain: req.query.spaceDomain as string
      }
    });
    if (!space) {
      return res.status(201).end();
    }
  }
  const spaceId = space?.id || req.query.spaceId as string;

  if (!spaceId) {
    return res.status(400).json({ error: 'spaceId is required' });
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
