import type { FiatCurrency } from 'connectors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { pricingGetter } from 'lib/crypto-price/getters';
import { onError, onNoMatch, requireUserOrSharePage } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { DataNotFoundError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUserOrSharePage).get(getPrice);

async function getPrice(req: NextApiRequest, res: NextApiResponse<any>) {
  const { base, quote } = req.query;

  const priceQuote = await pricingGetter.getQuote(base as string, quote as FiatCurrency);
  if (!priceQuote) {
    throw new DataNotFoundError(`Could not find price quote (${base}: ${quote})`);
  }

  return res.status(200).json(priceQuote);
}

export default withSessionRoute(handler);
