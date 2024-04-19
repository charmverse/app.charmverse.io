import { Box, Stack } from '@mui/material';
import { getChainById } from 'connectors/chains';

import { usePaymentMethods } from 'hooks/usePaymentMethods';
import { getTokenInfo } from 'lib/tokens/tokenData';

import TokenLogo from './TokenLogo';

export function TokenBadge({
  tokenAddress,
  chainId,
  tokenAmount
}: {
  tokenAmount?: number | null;
  tokenAddress: string | null;
  chainId: number | null;
}) {
  const [paymentMethods] = usePaymentMethods();

  if (!tokenAddress || !chainId) {
    return null;
  }

  const tokenInfo = getTokenInfo({
    chainId,
    methods: paymentMethods,
    symbolOrAddress: tokenAddress
  });

  const chain = getChainById(chainId);

  if (!chain) {
    return null;
  }

  return (
    <Stack flexDirection='row' gap={0.75} alignItems='center'>
      <TokenLogo src={tokenInfo.canonicalLogo} height={20} />
      <Box component='span'>{tokenAmount}</Box>
      <Box component='span'>{tokenInfo.tokenSymbol}</Box>
      <Box component='span'>on {chain.chainName}</Box>
    </Stack>
  );
}
