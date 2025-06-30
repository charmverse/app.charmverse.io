'use server';

import { prisma } from '@charmverse/core/prisma-client';
import { authActionClient } from '@packages/nextjs/actions/actionClient';

import { schema } from './form';

export const onboardingAction = authActionClient
  .metadata({ actionName: 'onboarding' })
  .schema(schema)
  .action(async ({ parsedInput, ctx }) => {
    const userId = ctx.session.user?.id;

    await prisma.user.update({
      where: { id: userId },
      data: {
        connectOnboarded: true,
        email: parsedInput.email
      }
    });

    return { success: true };
  });
