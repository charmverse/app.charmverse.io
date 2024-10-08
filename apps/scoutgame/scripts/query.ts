import { authorizeUserByLaunchDate } from '../lib/session/authorizeUserByLaunchDate';
import { prisma } from '@charmverse/core/prisma-client';

import { savePendingTransaction } from '@packages/scoutgame/savePendingTransaction';

async function main() {
  const scout = await prisma.connectWaitlistSlot.findFirstOrThrow({
    where: {
      username: 'qqsksk12'
    }
  });
  try {
    const authorized = await savePendingTransaction({
      user: {
        scoutId: '31f02791-58dd-4e5f-8bcd-cee22a762406';
        walletAddress: '0x09cedb7bb69f9f6df646dba107d2baacda93d6c9'
      },
      transactionInfo: {
        sourceChainId: 8453,
        sourceChainTxHash: '0x16fcac4b9d0c47584d3c019f0d9d421c3537c58016c0d91887e0b2b73dba64a0',
        destinationChainId: 10,
      },
      purchaseInfo: {
        builderContractAddress: '0x743ec903fe6d05e73b19a6db807271bb66100e83',
        tokenAmount: ???,
        tokenId: 22,
        quotedPrice: ???,
        quotedPriceCurrency: '0x0b2c639c533813f4aa9d7837caf62653d097ff85', // production usdc
      }
    });
    console.log(`User ${scout.fid} is authorized: ${authorized}`);
  } catch (error) {
    console.error(`Error authorizing user ${scout.fid}: ${error}`);
    console.log(scout);
  }
}

main();
