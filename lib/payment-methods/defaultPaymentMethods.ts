import type { PaymentMethod, Space } from '@prisma/client';

import { prisma } from 'db';
import { DataNotFoundError } from 'lib/utilities/errors';

const defaultPaymentMethods: Pick<PaymentMethod, 'chainId' | 'contractAddress' | 'tokenLogo' | 'tokenSymbol' | 'tokenName' | 'tokenDecimals'> [] = [
  // ethereum
  {
    chainId: 1,
    contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    tokenDecimals: 6,
    tokenName: 'USD Coin',
    tokenSymbol: 'USDC',
    tokenLogo: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png'
  },
  // goerli
  {
    chainId: 5,
    contractAddress: '0x07865c6e87b9f70255377e024ace6630c1eaa37f',
    tokenDecimals: 6,
    tokenName: 'USD Coin',
    tokenSymbol: 'USDC',
    tokenLogo: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png'
  },
  // polygon
  {
    chainId: 137,
    contractAddress: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    tokenDecimals: 6,
    tokenName: 'USD Coin',
    tokenSymbol: 'USDC',
    tokenLogo: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png'
  }
];

/**
 * Provides USDC by default for a space on ETH Mainnet and Polygon
 * Executes in upsert mode to avoid duplicate payment method creation
 *
 * @createdBy Defaults to the space creator
 */
export async function setupDefaultPaymentMethods ({ createdBy, spaceIdOrSpace }:
    { createdBy?: string, spaceIdOrSpace: string | Pick<Space, 'id' | 'createdBy'> }): Promise<PaymentMethod[]> {

  const space: Pick<Space, 'id' | 'createdBy'> | null = typeof spaceIdOrSpace === 'string' ? await prisma.space.findUnique({ where: { id: spaceIdOrSpace } }) : spaceIdOrSpace;

  if (!space) {
    throw new DataNotFoundError(`Space with id ${spaceIdOrSpace} not found`);
  }

  const creatorId = createdBy ?? space.createdBy;

  const paymentMethodList = await prisma.$transaction(
    defaultPaymentMethods.map(paymentMethod => {
      return prisma.paymentMethod.upsert({
        where: {
          spaceId_chainId_contractAddress: {
            chainId: paymentMethod.chainId,
            contractAddress: paymentMethod.contractAddress as string,
            spaceId: space.id
          }
        },
        create: {
          ...paymentMethod,
          createdBy: creatorId,
          space: {
            connect: {
              id: space.id
            }
          },
          walletType: 'metamask'
        },
        update: {
          tokenLogo: paymentMethod.tokenLogo,
          tokenName: paymentMethod.tokenName,
          tokenSymbol: paymentMethod.tokenSymbol
        }
      });
    })
  );

  return paymentMethodList;
}
