'use server';

import { prisma } from '@charmverse/core/prisma-client';
import { authActionClient } from '@connect/lib/actions/actionClient';

import { sessionUserRelations } from 'lib/session/config';
import type { LoggedInUser } from 'models/User';

export const getCurrentUser = authActionClient
  .metadata({ actionName: 'onboarding' })
  .action<LoggedInUser | null>(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const user = await prisma.user.findUniqueOrThrow({
      where: {
        id: userId
      },
      include: sessionUserRelations
    });

    return user;
  });
