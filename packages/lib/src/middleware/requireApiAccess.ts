import { SystemError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { hasApiAccess } from '@packages/lib/subscription/constants';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { NextHandler } from 'next-connect';

export async function requireApiAccess(req: NextApiRequest, res: NextApiResponse, next: NextHandler) {
  if (!req.authorizedSpaceId) {
    throw new SystemError({
      message: 'No authorized space ID found',
      errorType: 'Subscription required',
      severity: 'warning'
    });
  }

  const space = await prisma.space.findUnique({
    where: { id: req.authorizedSpaceId },
    select: { subscriptionTier: true }
  });

  if (!space || !hasApiAccess(space.subscriptionTier)) {
    throw new SystemError({
      message: 'API access is only available for Gold and Grant tier spaces',
      errorType: 'Subscription required',
      severity: 'warning'
    });
  }

  next();
}

export default requireApiAccess;
