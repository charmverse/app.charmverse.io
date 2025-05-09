import { prisma } from '@charmverse/core/prisma-client';

const opToken = {
  chainId: 10,
  contractAddress: '0x4200000000000000000000000000000000000042',
  tokenDecimals: 18,
  tokenName: 'Optimism',
  tokenSymbol: 'OP',
  // tokenLogo: '/images/cryptoLogos/optimism.svg',
  tokenLogo: 'https://optimistic.etherscan.io/token/images/optimism_32.png'
};

const arbToken = {
  chainId: 42161,
  contractAddress: '0x912CE59144191C1204E64559FE8253a0e49E6548',
  tokenDecimals: 18,
  tokenName: 'Arbitrum',
  tokenSymbol: 'ARB',
  // tokenLogo: '/images/cryptoLogos/optimism.svg',
  tokenLogo: 'https://static.alchemyapi.io/images/assets/11841.png'
};

// a function that adds OP token as a default payment for all spaces in the database
async function init() {
  const spaces = await prisma.space.findMany();
  const paymentMethods = await prisma.paymentMethod.findMany();

  let newTokens = 0;

  console.log('found', spaces.length, 'spaces and', paymentMethods.length, 'payment methods');

  for (let space of spaces) {
    const methods = paymentMethods.filter((method) => method.spaceId === space.id);
    const transactions: any = [];
    if (!methods.find((method) => method.chainId === opToken.chainId)) {
      transactions.push(
        prisma.paymentMethod.create({
          data: {
            ...opToken,
            spaceId: space.id,
            createdBy: space.createdBy,
            walletType: 'metamask'
          }
        })
      );
    }
    if (!methods.find((method) => method.chainId === arbToken.chainId)) {
      transactions.push(
        prisma.paymentMethod.create({
          data: {
            ...arbToken,
            spaceId: space.id,
            createdBy: space.createdBy,
            walletType: 'metamask'
          }
        })
      );
    }
    if (transactions.length) {
      await prisma.$transaction(transactions);
      newTokens += transactions.length;
    }
    if ((newTokens / 2) % 100 === 0) {
      console.log('added tokens', newTokens);
    }
  }
  console.log('added tokens', newTokens);
}

init();
