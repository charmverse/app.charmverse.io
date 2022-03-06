
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { TokenGate, Space } from '@prisma/client';
import { prisma } from 'db';
import { onError, onNoMatch, requireUser, hasAccessToSpace } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .post(saveTokenGate)
  .get(getTokenGates);

async function saveTokenGate (req: NextApiRequest, res: NextApiResponse) {

  const { error } = await hasAccessToSpace({
    userId: req.session.user.id,
    spaceId: req.body.spaceId,
    role: 'admin'
  });
  if (error) {
    return res.status(401).json({ error });
  }

  const result = await prisma.tokenGate.create({
    data: {
      createdBy: req.session.user.id,
      ...req.body
    }
  });

  res.status(200).json(result);
}

async function getTokenGates (req: NextApiRequest, res: NextApiResponse<TokenGate[] | { error: string }>) {

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
      space: true
    }
  });

  res.status(200).json(result);
}

export default withSessionRoute(handler);
