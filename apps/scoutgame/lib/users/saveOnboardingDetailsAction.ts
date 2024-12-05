'use server';

import { prisma } from '@charmverse/core/prisma-client';
import { authActionClient } from '@packages/scoutgame/actions/actionClient';
import { generateUserPath } from '@packages/scoutgame/users/generateUserPath';

import { saveOnboardingDetailsSchema } from './saveOnboardingDetailsSchema';

export const saveOnboardingDetailsAction = authActionClient
  .metadata({ actionName: 'save-onboarding-details' })
  .schema(saveOnboardingDetailsSchema)
  .action(async ({ parsedInput, ctx }) => {
    const userId = ctx.session.scoutId;
    const existingUser = await prisma.scout.findUniqueOrThrow({
      where: { id: userId },
      select: {
        displayName: true
      }
    });

    if (!parsedInput.agreedToTOS) {
      throw new Error('You need to accept the terms and conditions.');
    }

    const path =
      existingUser.displayName === parsedInput.displayName
        ? undefined
        : await generateUserPath(parsedInput.displayName);

    await prisma.scout.update({
      where: { id: userId },
      data: {
        email: parsedInput.email,
        sendMarketing: parsedInput.sendMarketing,
        agreedToTermsAt: new Date(),
        onboardedAt: new Date(),
        avatar: parsedInput.avatar,
        displayName: parsedInput.displayName,
        path,
        bio: parsedInput.bio
      }
    });

    return { success: true };
  });
