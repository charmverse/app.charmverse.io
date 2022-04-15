import { ApiError, onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { getTokenMetaData, ITokenMetadata } from 'lib/tokens/tokenData';
import { isValidChainAddress } from 'lib/tokens/validation';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(loadTokenMetaData);

async function loadTokenMetaData (req: NextApiRequest, res: NextApiResponse<ITokenMetadata>) {
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

  const tokenMetaData = await getTokenMetaData({
    chainId: parsedChainId,
    contractAddress: contractAddress as string
  });

  return res.status(200).json(tokenMetaData);
}

export default withSessionRoute(handler);
