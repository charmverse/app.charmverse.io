import { Box, Stack } from '@mui/material';

import TokenLogo from 'components/common/TokenLogo';
import { usePaymentMethods } from 'hooks/usePaymentMethods';
import { getTokenInfo } from 'lib/tokens/tokenData';

type Props = {
  amount: string | number;
  chainId: string;
  symbolOrAddress: string;
};

export function TokenAmount({ amount, chainId, symbolOrAddress }: Props): JSX.Element {
  const [methods] = usePaymentMethods();
  const tokenInfo = symbolOrAddress ? getTokenInfo({ chainId: parseInt(chainId, 10), methods, symbolOrAddress }) : null;
  return (
    <Stack direction='row' alignItems='center' height='100%' gap={1} className='octo-propertyvalue readonly'>
      {tokenInfo?.canonicalLogo && (
        <Box width={20}>
          <TokenLogo height={20} src={tokenInfo?.canonicalLogo} />
        </Box>
      )}
      {amount}
    </Stack>
  );
}
