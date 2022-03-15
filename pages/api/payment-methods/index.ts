
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { Prisma, Page, PaymentMethod } from '@prisma/client';
import { prisma } from 'db';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { requireSpaceMembership } from 'lib/middleware/requireSpaceMembership';
import { withSessionRoute } from 'lib/session/withSession';
import { IEventToLog, postToDiscord } from 'lib/logs/notifyDiscord';
import { IApiError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .use(requireSpaceMembership)
  .get(listPaymentMethods)
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

async function createPaymentMethod (req: NextApiRequest, res: NextApiResponse<PaymentMethod>) {

  const data = req.body as PaymentMethod;

  const paymentMethodToCreate: Prisma.PaymentMethodCreateInput = {
    chainId: data.chainId,
    contractAddress: data.contractAddress,
    tokenSymbol: data.tokenSymbol,
    tokenLogo: data.tokenLogo,
    createdBy: req.session.user.id,
    space: {
      connect: {
        id: data.spaceId
      }
    }
  };

  const paymentMethod = await prisma.paymentMethod.create({ data: paymentMethodToCreate });
  return res.status(200).json(paymentMethod);
}

export default withSessionRoute(handler);
