'use server';

import { prisma } from '@charmverse/core/prisma-client';
import { redirect } from 'next/navigation';
import { v4 } from 'uuid';

import type { FormValues } from 'components/welcome/utils/form';
import { schema } from 'components/welcome/utils/form';

export async function onboardingAction(_prevState: FormValues, formData: FormData) {
  'use server';

  // Still working on this one

  return { message: 'dsadsa' };
  const user = { id: v4() };
  const data = Object.fromEntries(formData);
  const validatedData = await schema.validate(data);

  if (validatedData.wallet) {
    await prisma.userWallet.create({
      data: {
        address: validatedData.wallet,
        userId: user.id
      }
    });
  }

  await prisma.user.update({});

  redirect('/profile');
}
