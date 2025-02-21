import { Box, Stack, Typography } from '@mui/material';
import { getChainById } from '@packages/blockchain/connectors/chains';

import { EmptyPlaceholder } from 'components/common/DatabaseEditor/components/properties/EmptyPlaceholder';
import { TokenLogo } from 'components/common/Icons/TokenLogo';
import { usePaymentMethods } from 'hooks/usePaymentMethods';
import { getTokenInfo } from 'lib/tokens/tokenData';

type Props = {
  chainId: number | null;
  symbolOrAddress: string | null;
  rewardAmount: number | null;
};

export function RewardTokenInfo({ chainId, symbolOrAddress, rewardAmount }: Props) {
  const [paymentMethods] = usePaymentMethods();
  const currentChain = !!chainId && getChainById(chainId);

  const tokenInfo =
    (!!chainId &&
      !!symbolOrAddress &&
      getTokenInfo({
        chainId,
        symbolOrAddress,
        methods: paymentMethods
      })) ||
    null;

  return tokenInfo ? (
    <Stack direction='row'>
      <Box
        component='span'
        sx={{
          width: 25,
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <TokenLogo src={tokenInfo.canonicalLogo} />
      </Box>

      <Typography component='span' variant='subtitle1' fontWeight='normal'>
        {rewardAmount}
      </Typography>
      <Typography ml={0.5} component='span' variant='subtitle1' fontWeight='normal'>
        {tokenInfo.tokenSymbol?.toUpperCase()} {currentChain ? `(${currentChain.chainName})` : ''}
      </Typography>
    </Stack>
  ) : (
    <EmptyPlaceholder>Empty</EmptyPlaceholder>
  );
}
