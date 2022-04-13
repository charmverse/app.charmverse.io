import { Prisma, SpaceRole } from '@prisma/client';
import { prisma } from 'db';
import { ApiError } from 'lib/middleware';
import { ISystemError } from 'lib/utilities/errors';
import { NextApiRequest, NextApiResponse } from 'next';
import { NextHandler } from 'next-connect';

/**
 * Allow an endpoint to be consumed if it originates from a share page
 */
export function requireSpaceMembership (role?: SpaceRole['role']) {
  return async (req: NextApiRequest, res: NextApiResponse<ISystemError>, next: NextHandler) => {

    if (!req.session.user) {
      throw new ApiError({
        message: 'Please log in',
        errorType: 'Access denied'
      });
    }

    const querySpaceId = req.query?.spaceId as string;

    const bodySpaceId = req.body?.spaceId as string;

    const spaceId = querySpaceId ?? bodySpaceId;

    if (!spaceId) {
      throw new ApiError({
        message: 'Please provide a space Id',
        errorType: 'Invalid input'
      });
    }

    if (querySpaceId && bodySpaceId && querySpaceId !== bodySpaceId) {
      throw new ApiError({
        message: 'Your request refers to multiple spaces. Remove unneeded space ID',
        errorType: 'Access denied'
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
      throw new ApiError({
        message: role ? `Your are not ${role === 'admin' ? 'an' : 'a'} ${role} of this space` : 'You do not have access to this space',
        errorType: 'Access denied'
      });
    }
    else {
      next();
    }
  };
}
