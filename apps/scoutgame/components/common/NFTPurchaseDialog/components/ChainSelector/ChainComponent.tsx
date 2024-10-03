import DoneIcon from '@mui/icons-material/Done';
import { Stack, Typography, Grid2, Box } from '@mui/material';
import Image from 'next/image';

import type { ChainWithCurrency } from './chains';

export function ChainComponent({
  chain,
  balance,
  selected
}: {
  chain: ChainWithCurrency;
  balance?: string | number;
  selected?: boolean;
}) {
  return (
    <Grid2 width='100%' container flexDirection='row' gap={2} alignItems='center' justifyContent='space-between' pr={2}>
      <Grid2 display='flex' flexDirection='row' alignItems='center' gap={2}>
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
      </Grid2>
      <Grid2>{!!selected && <DoneIcon />}</Grid2>
    </Grid2>
  );
}
