import type { IdentityType } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import { trackUserActionOp } from './trackUserActionOp';

export async function trackOpSpaceSuccessfulSigninEvent({
  userId,
  isSpaceMember,
  identityType
}: {
  userId: string;
  isSpaceMember?: boolean;
  identityType: IdentityType;
}) {
  const isOpGrantsSpaceMember =
    isSpaceMember ??
    (await prisma.spaceRole.findFirst({
      where: {
        userId,
        space: {
          domain: 'op-grants'
        }
      },
      select: {
        id: true,
        user: {
          select: {
            identityType: true
          }
        }
      }
    }));

  if (isOpGrantsSpaceMember) {
    trackUserActionOp('successful_signin', {
      userId,
      signinMethod: identityType
    });
  }
}

export async function trackOpSpaceClickSigninEvent({
  userId,
  isSpaceMember,
  identityType
}: {
  userId: string;
  isSpaceMember?: boolean;
  identityType: IdentityType;
}) {
  const isOpGrantsSpaceMember =
    isSpaceMember ??
    (await prisma.spaceRole.findFirst({
      where: {
        userId,
        space: {
          domain: 'op-grants'
        }
      },
      select: {
        id: true,
        user: {
          select: {
            identityType: true
          }
        }
      }
    }));

  if (isOpGrantsSpaceMember) {
    trackUserActionOp('click_signin', {
      userId,
      signinMethod: identityType
    });
  }
}
