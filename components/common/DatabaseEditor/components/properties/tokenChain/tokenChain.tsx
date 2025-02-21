import { Chip } from '@mui/material';
import { getChainById } from '@packages/connectors/chains';
import { shortWalletAddress } from '@packages/utils/blockchain';
import { isAddress } from 'viem';

import { usePaymentMethods } from 'hooks/usePaymentMethods';
import { getTokenInfo } from 'lib/tokens/tokenData';

type Props = {
  chainId: string; // values are strings in focalboard
  symbolOrAddress: string;
};

export function TokenChain({ symbolOrAddress, chainId }: Props): JSX.Element {
  const [methods] = usePaymentMethods();
  const chain = typeof chainId === 'string' ? getChainById(parseInt(chainId, 10)) : null;
  const tokenInfo =
    chain && symbolOrAddress ? getTokenInfo({ chainId: chain.chainId, methods, symbolOrAddress }) : null;
  const tokenName =
    tokenInfo && isAddress(tokenInfo.tokenSymbol)
      ? shortWalletAddress(tokenInfo.tokenSymbol)
      : tokenInfo?.tokenSymbol.toUpperCase();
  const displayValue = tokenInfo && chain ? `${tokenName} on ${chain.chainName}` : '';
  return (
    <div className='octo-propertyvalue readonly'>{displayValue && <Chip size='small' label={displayValue} />}</div>
  );
}
