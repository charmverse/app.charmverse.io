
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { getTokenMetaData, ITokenMetadata } from 'lib/tokens/tokenData';
import { isValidChainAddress } from 'lib/tokens/validation';
import { IApiError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(loadTokenMetaData);

async function loadTokenMetaData (req: NextApiRequest, res: NextApiResponse<ITokenMetadata | IApiError>) {
  const { chainId, contractAddress } = req.query;

  const parsedChainId = parseInt(chainId as string);

  if (Number.isNaN(parsedChainId)) {
    return res.status(400).json({ message: 'Please provide a valid chainId' });
  }

  if (!contractAddress || !isValidChainAddress(contractAddress as string)) {
    return res.status(400).json({ message: 'Please provide a valid chainId and contract address' });
  }

  const tokenMetaData = await getTokenMetaData({
    chainId: parsedChainId,
    contractAddress: contractAddress as string
  });

  return res.status(200).json(tokenMetaData);
}

export default withSessionRoute(handler);
