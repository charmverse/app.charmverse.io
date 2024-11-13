'use server';

import { log } from '@charmverse/core/log';
import { savePendingTransaction } from '@packages/scoutgame/savePendingTransaction';
import { getUserFromSession } from '@packages/scoutgame/session/getUserFromSession';
import { isAddress } from 'viem';
import * as yup from 'yup';

import { authActionClient } from '../actions/actionClient';

export const saveDecentTransactionAction = authActionClient
  .metadata({ actionName: 'save-decent-transaction' })
  .schema(
    yup.object().shape({
      user: yup.object().shape({
        id: yup.string().required(),
        walletAddress: yup
          .string()
          .required()
          .test('Valid address', (v) => isAddress(v))
      }),
      transactionInfo: yup.object().shape({
        sourceChainId: yup.number().required(),
        sourceChainTxHash: yup.string().required(),
        destinationChainId: yup.number().required()
      }),
      purchaseInfo: yup.object().shape({
        builderContractAddress: yup.string().required(),
        tokenAmount: yup.number().required(),
        tokenId: yup.number().required(),
        quotedPrice: yup.number().required(),
        quotedPriceCurrency: yup.string().required()
      })
    })
  )
  .action(async ({ parsedInput }) => {
    const userId = await getUserFromSession().then((u) => u?.id);

    if (!userId) {
      throw new Error('User not found');
    }

    // Cron process will handle the tx
    const data = await savePendingTransaction({
      ...parsedInput,
      user: { ...(parsedInput.user as any), scoutId: userId }
    });
    log.info('Saved NFT transaction', {
      transactionInfo: parsedInput.transactionInfo,
      purchaseInfo: parsedInput.purchaseInfo,
      pendingTransactionId: data.id,
      userId
    });

    return { id: data.id, txHash: data.sourceChainTxHash };
  });
