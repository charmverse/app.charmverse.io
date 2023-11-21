import { getChainById } from 'connectors/chains';

import { getTokenInfo } from 'lib/tokens/tokenData';

type Props = {
  chainId?: string; // values are strings in focalboard
  symbolOrAddress?: string;
};

export function TokenChain({ symbolOrAddress, chainId }: Props): JSX.Element {
  const chain = typeof chainId === 'string' ? getChainById(parseInt(chainId, 10)) : null;
  const tokenInfo =
    chain && symbolOrAddress ? getTokenInfo({ chainId: chain.chainId, symbolOrAddress, methods: [] }) : null;
  const displayValue = tokenInfo && chain ? `${tokenInfo.tokenSymbol?.toUpperCase()} on ${chain.chainName}` : '';
  return <div className='octo-propertyvalue readonly'>{displayValue}</div>;
}
