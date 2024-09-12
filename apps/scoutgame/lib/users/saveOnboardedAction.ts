'use server';

import { prisma } from '@charmverse/core/prisma-client';

import { authActionClient } from 'lib/actions/actionClient';

export const saveOnboardedAction = authActionClient
  .metadata({ actionName: 'save-onboarded' })
  .action(async ({ ctx }) => {
    const userId = ctx.session.user?.id;

    await prisma.scout.update({
      where: { id: userId },
      data: {
        onboarded: true
      }
    });

    return { success: true };
  });
