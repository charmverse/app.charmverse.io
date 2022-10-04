
import type { PaymentMethod, Prisma } from '@prisma/client';
import type { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { ApiError, onError, onNoMatch, requireKeys, requireSpaceMembership } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { isValidChainAddress } from 'lib/tokens/validation';

import { InvalidInputError } from '../../../lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireSpaceMembership())
  .get(listPaymentMethods)
  .use(requireKeys<PaymentMethod>(['chainId', 'spaceId', 'tokenSymbol', 'tokenName', 'tokenDecimals', 'walletType'], 'body'))
  .post(createPaymentMethod);

async function listPaymentMethods (req: NextApiRequest, res: NextApiResponse<PaymentMethod []>) {

  const { spaceId } = req.query;

  const paymentMethods = await prisma.paymentMethod.findMany({
    where: {
      spaceId: spaceId as string
    }
  });
  return res.status(200).json(paymentMethods);
}

async function createPaymentMethod (req: NextApiRequest, res: NextApiResponse<PaymentMethod>) {

  const {
    chainId,
    contractAddress,
    gnosisSafeAddress,
    tokenSymbol,
    tokenLogo,
    spaceId,
    tokenName,
    tokenDecimals,
    walletType
  } = req.body as PaymentMethod;

  if (walletType === 'metamask' && !(contractAddress && isValidChainAddress(contractAddress))) {
    throw new ApiError({
      message: 'Contract address is invalid',
      errorType: 'Invalid input'
    });
  }
  if (walletType === 'gnosis' && !(gnosisSafeAddress && isValidChainAddress(gnosisSafeAddress))) {
    throw new ApiError({
      message: 'Safe address is invalid',
      errorType: 'Invalid input'
    });
  }

  const paymentMethodToCreate: Prisma.PaymentMethodCreateInput = {
    chainId,
    contractAddress,
    tokenSymbol,
    tokenName,
    tokenLogo,
    tokenDecimals,
    gnosisSafeAddress,
    createdBy: req.session.user.id,
    walletType,
    space: {
      connect: {
        id: spaceId
      }
    }
  };

  try {

    const paymentMethod = await prisma.paymentMethod.create({ data: paymentMethodToCreate });

    return res.status(200).json(paymentMethod);
  }
  catch (err) {
    // P2002 is thrown by prisma when a duplicate write fails
    if ((err as PrismaClientKnownRequestError).code === 'P2002') {
      throw new InvalidInputError('A payment method with this contract address and chain ID already exists.');
    }
    throw err;
  }

}

export default withSessionRoute(handler);
