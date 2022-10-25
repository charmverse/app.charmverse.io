import type { NextApiRequest, NextApiResponse } from 'next';
import type { NextHandler } from 'next-connect';

import { prisma } from 'db';
import { ApiError } from 'lib/middleware';
import type { ISystemError } from 'lib/utilities/errors';

import { AdministratorOnlyError, UserIsNotSpaceMemberError } from '../users/errors';

/**
 * Allow an endpoint to be consumed if it originates from a share page
 */
export function requireSpaceMembership (options: { adminOnly: boolean, spaceIdKey?: string } = { adminOnly: false }) {
  return async (req: NextApiRequest, res: NextApiResponse<ISystemError>, next: NextHandler) => {

    // Where to find the space ID
    const spaceIdKey = options.spaceIdKey ?? 'spaceId';

    if (!req.session.user) {
      throw new ApiError({
        message: 'Please log in',
        errorType: 'Access denied'
      });
    }

    const querySpaceId = req.query?.[spaceIdKey];

    const bodySpaceId = req.body?.[spaceIdKey];

    const spaceId = querySpaceId ?? bodySpaceId;

    if (typeof spaceId !== 'string' || spaceId === '') {
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

    const spaceRole = await prisma.spaceRole.findFirst({
      where: {
        userId: req.session.user.id,
        spaceId
      }
    });

    if (!spaceRole) {
      throw new UserIsNotSpaceMemberError();
    }

    if (options.adminOnly && spaceRole.isAdmin !== true) {
      throw new AdministratorOnlyError();
    }

    else {
      next();
    }
  };
}
