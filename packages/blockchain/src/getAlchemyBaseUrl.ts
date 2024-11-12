import env from '@beam-australia/react-env';

import { getChainById } from './chains';

type AlchemyApiSuffix = '' | 'nft';

export const getAlchemyBaseUrl = (
  chainId: number = 1,
  apiSuffix: AlchemyApiSuffix = '',
  version: 'v2' | 'v3' = 'v2'
): string => {
  const apiKey = process.env.ALCHEMY_API_KEY || env('ALCHEMY_API_KEY');

  if (!apiKey) {
    throw new Error('No api key provided for Alchemy');
  }

  const alchemyUrl = getChainById(chainId)?.alchemyUrl;
  if (!alchemyUrl) throw new Error(`Chain id "${chainId}" not supported by Alchemy`);

  const apiSuffixPath = apiSuffix ? `${apiSuffix}/` : '';

  return `${alchemyUrl}/${apiSuffixPath}${version}/${apiKey}`;
};
