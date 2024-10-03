import { Stack, Typography } from '@mui/material';
import Image from 'next/image';

import type { ChainWithCurrency } from './chains';

export function ChainComponent({ chain, balance }: { chain: ChainWithCurrency; balance?: string | number }) {
  return (
    <Stack flexDirection='row' gap={2} alignItems='center'>
      <Image height={30} width={30} alt={chain.name} src={chain.icon} />
      <Stack>
        <Typography variant='body2' fontWeight='bold'>
          {chain.currency} on {chain.name}
        </Typography>
        {typeof balance !== 'undefined' && (
          <Typography variant='body2'>
            Balance: {balance} {chain.currency}
          </Typography>
        )}
      </Stack>
    </Stack>
  );
}
