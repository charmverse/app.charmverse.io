import type { PaymentMethod, Space } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { DataNotFoundError } from '@packages/utils/errors';

import { defaultPaymentMethods } from './defaultPaymentMethods';

/**
 * Provides USDC by default for a space on ETH Mainnet and Polygon
 * Executes in upsert mode to avoid duplicate payment method creation
 *
 * @createdBy Defaults to the space creator
 */
export async function setupDefaultPaymentMethods({
  createdBy,
  spaceIdOrSpace
}: {
  createdBy?: string;
  spaceIdOrSpace: string | Pick<Space, 'id' | 'createdBy'>;
}): Promise<PaymentMethod[]> {
  const space: Pick<Space, 'id' | 'createdBy'> | null =
    typeof spaceIdOrSpace === 'string'
      ? await prisma.space.findUnique({ where: { id: spaceIdOrSpace } })
      : spaceIdOrSpace;

  if (!space) {
    throw new DataNotFoundError(`Space with id ${spaceIdOrSpace} not found`);
  }

  const creatorId = createdBy ?? space.createdBy;

  const paymentMethodList = await prisma.$transaction(
    defaultPaymentMethods.map((paymentMethod) => {
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
