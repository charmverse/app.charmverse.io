import { log } from '@charmverse/core/log';
import { Box, Stack } from '@mui/material';
import { useMemo } from 'react';

import { TokenLogo } from 'components/common/Icons/TokenLogo';
import { usePaymentMethods } from 'hooks/usePaymentMethods';
import { getTokenInfo } from '@packages/lib/tokens/tokenData';

type Props = {
  amount: string | number;
  chainId: string;
  symbolOrAddress: string;
};

export function TokenAmount({ amount, chainId, symbolOrAddress }: Props): JSX.Element {
  const [methods] = usePaymentMethods();
  const tokenInfo = useMemo(() => {
    if (symbolOrAddress) {
      try {
        return getTokenInfo({ chainId: parseInt(chainId, 10), methods, symbolOrAddress });
      } catch (e) {
        log.error('Cannot get token info', e);
      }
    }
    return null;
  }, [chainId, methods, symbolOrAddress]);
  return (
    <Stack direction='row' alignItems='center' height='100%' gap={1} className='octo-propertyvalue readonly'>
      {tokenInfo?.canonicalLogo && <TokenLogo src={tokenInfo?.canonicalLogo} />}
      {amount}
    </Stack>
  );
}
