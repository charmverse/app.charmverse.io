'use server';

import { prisma } from '@charmverse/core/prisma-client';
import { redirect } from 'next/navigation';
import { v4 } from 'uuid';

import { schema } from 'components/welcome/utils/form';
import { authActionClient, actionClient } from 'lib/actions/actionClient';
import { delay } from 'lib/utils/delay';

export const actionOnboarding = authActionClient
  .schema(schema)
  .metadata({ actionName: 'onboarding' })
  .action(async ({ parsedInput, ctx }) => {
    const userId = ctx.session.user?.id;
    await delay(2000);

    return { message: 'success' };

    // if (validatedData.wallet) {
    //   await prisma.userWallet.create({
    //     data: {
    //       address: validatedData.wallet,
    //       userId: user.id
    //     }
    //   });
    // }

    // redirect('/profile');
  });
