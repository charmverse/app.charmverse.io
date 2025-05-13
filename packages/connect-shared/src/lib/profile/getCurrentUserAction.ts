'use server';

import type { FarcasterUser, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { authActionClient } from '@packages/nextjs/actions/actionClient';
import { replaceS3Domain } from '@packages/utils/url';

export type LoggedInUser = User & {
  farcasterUser?: FarcasterUser | null;
};

export const getCurrentUserAction = authActionClient
  .metadata({ actionName: 'getCurrentUser' })
  .action<LoggedInUser | null>(async ({ ctx }) => {
    const userId = ctx.session.user?.id;

    const user = await prisma.user.findUniqueOrThrow({
      where: {
        id: userId
      },
      include: {
        farcasterUser: true
      }
    });

    if (user?.avatar) {
      user.avatar = replaceS3Domain(user.avatar);
    }

    return user;
  });
