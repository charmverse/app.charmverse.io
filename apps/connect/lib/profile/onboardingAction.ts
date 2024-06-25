'use server';

import { prisma } from '@charmverse/core/prisma-client';

import { schema } from 'components/welcome/utils/form';
import { authActionClient } from 'lib/actions/actionClient';

export const actionOnboarding = authActionClient
  .metadata({ actionName: 'onboarding' })
  .schema(schema)
  .action(async ({ parsedInput, ctx }) => {
    const userId = ctx.session.user.id;

    await prisma.user.update({
      where: { id: userId },
      data: {
        connectOnboarded: true,
        email: parsedInput.email,
        emailNewsletter: parsedInput.notify
      }
    });

    return null;
  });
