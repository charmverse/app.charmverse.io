import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from 'db';

/**
 * Allow an endpoint to be consumed if it originates from a share page
 */
export async function requireSpaceMembership (req: NextApiRequest, res: NextApiResponse, next: Function) {

  if (!req.session.user) {
    return res.status(401).send({ error: 'Please log in' });
  }

  const spaceId = req.query.spaceId ?? req.body.spaceId;

  if (!spaceId) {
    return res.status(400).json({
      message: 'Please provide a space Id'
    });
  }

  const spaceRole = await prisma.spaceRole.findFirst({
    where: {
      userId: req.session.user.id,
      spaceId: spaceId as string
    }
  });

  if (!spaceRole) {
    return res.status(401).send({
      message: 'You do not have access to this space'
    });
  }
  else {
    next();
  }
}
