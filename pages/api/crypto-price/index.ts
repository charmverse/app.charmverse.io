
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { Prisma, Space } from '@prisma/client';
import { prisma } from 'db';
import { onError, onNoMatch, requireUserOrSharePage } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { gettingStartedPageContent } from 'seedData';
import { CryptoCurrency, FiatCurrency } from 'connectors';
import { pricingGetter } from 'lib/crypto-price/getters';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUserOrSharePage).get(getPrice);

async function getPrice (req: NextApiRequest, res: NextApiResponse<any>) {
  const { base, quote } = req.query;

  const priceQuote = await pricingGetter.getQuote(base as string, quote as FiatCurrency);

  return res.status(200).json(priceQuote);
}

export default withSessionRoute(handler);
