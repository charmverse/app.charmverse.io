'use server';

import { revalidatePath } from 'next/cache';
import * as yup from 'yup';

import { authActionClient } from '../actions/actionClient';
import { getUserFromSession } from '../session/getUserFromSession';

import { handlePendingTransaction } from './handlePendingTransaction';

export const checkDecentTransactionAction = authActionClient
  .metadata({ actionName: 'handle-mint-nft' })
  .schema(
    yup.object().shape({
      pendingTransactionId: yup.string().required(),
      txHash: yup.string()
    })
  )
  .action(async ({ parsedInput }) => {
    const userId = await getUserFromSession().then((u) => u?.id);

    if (!userId) {
      throw new Error('User not found');
    }

    await handlePendingTransaction({
      pendingTransactionId: parsedInput.pendingTransactionId
    });

    revalidatePath('/', 'layout');

    return { success: true };
  });
