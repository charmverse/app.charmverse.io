'use server';

import { prisma } from '@charmverse/core/prisma-client';
import { authActionClient } from '@connect/lib/actions/actionClient';
import type { LoggedInUser } from '@connect/lib/profile/interfaces';

import { sessionUserRelations } from 'lib/session/config';

export const getCurrentUser = authActionClient
  .metadata({ actionName: 'getCurrentUser' })
  .action<LoggedInUser | null>(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const user = await prisma.user.findUniqueOrThrow({
      where: {
        id: userId
      },
      include: {
        farcasterUser: true
      }
    });

    return user;
  });
