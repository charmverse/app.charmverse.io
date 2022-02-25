import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from 'db';
import { Role } from 'models';

export function requireSpaceUser (spaceId: string, role: Role = 'contributor') {
  return async (req: NextApiRequest, res: NextApiResponse, next: Function) => {
    const userId = req.session.user.id;
    const spaceRole = await prisma.spaceRole.findFirst({
      where: {
        spaceId,
        userId
      }
    });
    if (!spaceRole) {
      res.status(401).send({ error: 'User does not have access to space' });
    }
    else if (role === 'admin' && spaceRole.role !== role) {
      res.status(401).send({ error: 'Requires admin permission' });
    }
    else {
      next();
    }
  };
}
