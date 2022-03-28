import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from 'db';
import { IApiError } from 'lib/utilities/errors';
import { Prisma, SpaceRole } from '@prisma/client';

/**
 * Allow an endpoint to be consumed if it originates from a share page
 */
export function requireSpaceMembership (role?: SpaceRole['role']) {
  return async (req: NextApiRequest, res: NextApiResponse<IApiError>, next: Function) => {

    if (!req.session.user) {
      return res.status(401).send({ error: 'Please log in' } as any);
    }

    const querySpaceId = req.query?.spaceId as string;

    const bodySpaceId = req.body?.spaceId as string;

    const spaceId = querySpaceId ?? bodySpaceId;

    if (!spaceId) {
      return res.status(400).json({
        message: 'Please provide a space Id'
      });
    }

    if (querySpaceId && bodySpaceId && querySpaceId !== bodySpaceId) {
      return res.status(401).json({
        message: 'Your request refers to multiple spaces. Remove unneeded space ID'
      });
    }

    const spaceRoleWhereQuery: Prisma.SpaceRoleWhereInput = {
      userId: req.session.user.id,
      spaceId: spaceId as string
    };

    if (role) {
      spaceRoleWhereQuery.role = role;
    }
    const spaceRole = await prisma.spaceRole.findFirst({
      where: spaceRoleWhereQuery
    });

    if (!spaceRole) {
      return res.status(401).send({
        message: 'You do not have access to this space'
      });
    }
    else {

      next();
    }
  };
}
