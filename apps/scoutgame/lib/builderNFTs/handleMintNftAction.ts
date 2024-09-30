'use server';

import { handlePendingTransaction } from '@packages/scoutgame/handlePendingTransaction';
import * as yup from 'yup';

import { authActionClient } from 'lib/actions/actionClient';
import { getUserFromSession } from 'lib/session/getUserFromSession';

export const handleMintNftAction = authActionClient
  .metadata({ actionName: 'handle-mint-nft' })
  .schema(
    yup.object().shape({
      pendingTransactionId: yup.string().required()
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

    return { success: true };
  });
