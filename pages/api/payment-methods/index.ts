
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { Prisma, Page, PaymentMethod } from '@prisma/client';
import { prisma } from 'db';
import { onError, onNoMatch, requireUser, requireSpaceMembership, requireKeys } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { IEventToLog, postToDiscord } from 'lib/logs/notifyDiscord';
import { IApiError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .use(requireSpaceMembership)
  .get(listPaymentMethods)
  .use(requireKeys<PaymentMethod>(['chainId', 'contractAddress', 'spaceId', 'tokenSymbol'], 'body'))
  .post(createPaymentMethod);

async function listPaymentMethods (req: NextApiRequest, res: NextApiResponse<PaymentMethod [] | IApiError>) {

  const { spaceId } = req.query;

  const paymentMethods = await prisma.paymentMethod.findMany({
    where: {
      spaceId: spaceId as string
    }
  });
  return res.status(200).json(paymentMethods);
}

async function createPaymentMethod (req: NextApiRequest, res: NextApiResponse<PaymentMethod | IApiError>) {

  const { chainId, contractAddress, tokenSymbol, tokenLogo, spaceId } = req.body as PaymentMethod;

  const existingPaymentMethod = await prisma.paymentMethod.findFirst({
    where: {
      chainId,
      contractAddress,
      spaceId
    }
  });

  if (existingPaymentMethod) {
    return res.status(400).json({
      message: 'This payment method already exists'
    });
  }

  const paymentMethodToCreate: Prisma.PaymentMethodCreateInput = {
    chainId,
    contractAddress,
    tokenSymbol,
    tokenLogo,
    createdBy: req.session.user.id,
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
