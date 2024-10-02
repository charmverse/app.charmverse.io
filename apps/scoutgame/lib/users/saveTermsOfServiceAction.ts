'use server';

import { prisma } from '@charmverse/core/prisma-client';

import { authActionClient } from 'lib/actions/actionClient';

import { schema } from './termsOfServiceSchema';

export const saveTermsOfServiceAction = authActionClient
  .metadata({ actionName: 'terms-of-service' })
  .schema(schema)
  .action(async ({ parsedInput, ctx }) => {
    const userId = ctx.session.scoutId;

    if (!parsedInput.agreedToTOS) {
      throw new Error('You need to accept the terms and conditions.');
    }

    await prisma.scout.update({
      where: { id: userId },
      data: {
        email: parsedInput.email,
        sendMarketing: parsedInput.sendMarketing,
        agreedToTermsAt: new Date()
      }
    });

    return { success: true };
  });
