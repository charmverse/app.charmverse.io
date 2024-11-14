'use server';

import { prisma } from '@charmverse/core/prisma-client';
import { authActionClient } from '@packages/scoutgame/actions/actionClient';

export const saveOnboardedAction = authActionClient
  .metadata({ actionName: 'save-onboarded' })
  .action(async ({ ctx }) => {
    const userId = ctx.session.scoutId;

    await prisma.scout.update({
      where: { id: userId },
      data: {
        onboardedAt: new Date()
      }
    });

    return { success: true };
  });
