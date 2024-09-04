'use server';

import { prisma } from '@charmverse/core/prisma-client';
import { authActionClient } from '@connect-shared/lib/actions/actionClient';
import { replaceS3Domain } from '@root/lib/utils/url';

import type { LoggedInUser } from 'lib/auth/interfaces';

export const getCurrentUserAction = authActionClient
  .metadata({ actionName: 'getCurrentUser' })
  .action<LoggedInUser | null>(async ({ ctx }) => {
    const userId = ctx.session.user?.id;

    const user = await prisma.user.findUniqueOrThrow({
      where: {
        id: userId
      },
      include: {
        farcasterUser: true,
        wallets: {
          select: {
            id: true,
            address: true,
            ensname: true
          }
        }
      }
    });

    if (user?.avatar) {
      user.avatar = replaceS3Domain(user.avatar);
    }

    return user;
  });
