'use server';

import { prisma } from '@charmverse/core/prisma-client';
import { updateUserProfile } from '@packages/mixpanel/updateUserProfile';

import { authActionClient } from 'lib/actions/actionClient';

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

    await updateUserProfile(userId, {
      onboardedAt: new Date()
    });

    return { success: true };
  });
