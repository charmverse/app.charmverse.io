import { prisma } from '@charmverse/core/prisma-client';
import { ApiError } from '@packages/nextjs/errors';
import { AdministratorOnlyError, UserIsNotSpaceMemberError } from '@packages/users/errors';
import type { ISystemError } from '@packages/utils/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { NextHandler } from 'next-connect';

declare module 'http' {
  interface IncomingMessage {
    isAdmin: boolean;
    isGuest: boolean;
  }
}

/**
 * Allow an endpoint to be consumed if a user is a space member
 *
 * Also sets isAdmin status on the request
 *
 * @location if provided, only parse spaceIds from this location
 */
export function requireSpaceMembership(
  options: { adminOnly: boolean; spaceIdKey?: string; location?: 'query' | 'body' } = { adminOnly: false }
) {
  return async (req: NextApiRequest, res: NextApiResponse<ISystemError>, next: NextHandler) => {
    // Where to find the space ID
    const spaceIdKey = options.spaceIdKey ?? 'spaceId';

    if (!req.session.user) {
      throw new ApiError({
        message: 'Please log in',
        errorType: 'Access denied'
      });
    }

    const querySpaceId =
      !options.location || options.location === 'query' ? (req.query?.[spaceIdKey] as string) : undefined;

    const bodySpaceId = !options.location || options.location === 'body' ? req.body?.[spaceIdKey] : undefined;

    const spaceId = querySpaceId ?? bodySpaceId;

    if (typeof spaceId !== 'string' || spaceId === '') {
      throw new ApiError({
        message: 'Please provide a space Id',
        errorType: 'Invalid input'
      });
    }

    if (!spaceIdKey && querySpaceId && bodySpaceId && querySpaceId !== bodySpaceId) {
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
    } else {
      req.isAdmin = spaceRole.isAdmin;
      req.isGuest = !spaceRole.isAdmin && spaceRole.isGuest;
      next();
    }
  };
}
