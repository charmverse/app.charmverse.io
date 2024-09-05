'use server';

import type { Scout } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { authActionClient } from '@connect-shared/lib/actions/actionClient';
import { replaceS3Domain } from '@root/lib/utils/url';

export const getCurrentUserAction = authActionClient
  .metadata({ actionName: 'getCurrentUser' })
  .action<Scout | null>(async ({ ctx }) => {
    const userId = ctx.session.user?.id;

    const scout = await prisma.scout.findUniqueOrThrow({
      where: {
        id: userId
      }
    });

    if (scout.avatar) {
      scout.avatar = replaceS3Domain(scout.avatar);
    }

    return scout;
  });
