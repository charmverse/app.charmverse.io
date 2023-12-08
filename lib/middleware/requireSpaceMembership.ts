import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { NextHandler } from 'next-connect';

import type { ISystemError } from 'lib/utilities/errors';

import { AdministratorOnlyError, UserIsNotSpaceMemberError } from '../users/errors';

import { ApiError } from './errors';

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
 */
export function requireSpaceMembership(options: { adminOnly: boolean; spaceIdKey?: string } = { adminOnly: false }) {
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
