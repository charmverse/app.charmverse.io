'use server';

import { prisma } from '@charmverse/core/prisma-client';

import { authActionClient } from 'lib/actions/actionClient';

import { generateUserPath } from './generateUserPath';
import { saveOnboardingDetailsSchema } from './saveOnboardingDetailsSchema';

export const saveOnboardingDetailsAction = authActionClient
  .metadata({ actionName: 'terms-of-service' })
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
        avatar: parsedInput.avatar,
        displayName: parsedInput.displayName,
        path
      }
    });

    return { success: true };
  });
