
import { PaymentMethod, Prisma } from '@prisma/client';
import { prisma } from 'db';
import { ApiError, onError, onNoMatch, requireKeys, requireSpaceMembership, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { isValidChainAddress } from 'lib/tokens/validation';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
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

  const paymentMethod = await prisma.paymentMethod.create({ data: paymentMethodToCreate });
  return res.status(200).json(paymentMethod);
}

export default withSessionRoute(handler);
