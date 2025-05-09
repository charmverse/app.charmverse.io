import { ApiError } from '@packages/nextjs/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { SupportedChainId } from '@packages/lib/blockchain/provider/alchemy/config';
import { onError, onNoMatch, requireUser } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { getTokenMetadata } from '@packages/lib/tokens/getTokenMetadata';
import type { ITokenMetadata } from '@packages/lib/tokens/tokenData';
import { isValidChainAddress } from '@packages/lib/tokens/validation';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(loadTokenMetaData);

async function loadTokenMetaData(req: NextApiRequest, res: NextApiResponse<ITokenMetadata>) {
  const { chainId, contractAddress } = req.query;

  const parsedChainId = parseInt(chainId as string);

  if (Number.isNaN(parsedChainId)) {
    throw new ApiError({
      message: 'Please provide a valid chainId',
      errorType: 'Invalid input'
    });
  }

  if (!contractAddress || !isValidChainAddress(contractAddress as string)) {
    throw new ApiError({
      message: 'Please provide a valid chainId and contract address',
      errorType: 'Invalid input'
    });
  }

  const tokenMetaData = await getTokenMetadata({
    chainId: parsedChainId as SupportedChainId,
    contractAddress: contractAddress as string
  });

  return res.status(200).json(tokenMetaData);
}

export default withSessionRoute(handler);
