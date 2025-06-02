import DoneIcon from '@mui/icons-material/Done';
import { Stack, Typography, Grid, Box } from '@mui/material';
import Image from 'next/image';

import type { ChainWithCurrency } from './chains';

export function ChainComponent({
  chain,
  balance,
  selected
}: {
  chain: Pick<ChainWithCurrency, 'name' | 'icon' | 'currency' | 'id'>;
  balance?: string | number | bigint;
  selected?: boolean;
}) {
  const balanceNormalised = typeof balance === 'bigint' ? balance.toString() : balance;

  return (
    <Grid width='100%' container flexDirection='row' gap={2} alignItems='center' justifyContent='space-between' pr={2}>
      <Grid display='flex' flexDirection='row' alignItems='center' gap={2}>
        <Image height={30} width={30} alt={chain.name} src={chain.icon} />
        <Stack>
          <Typography variant='body2' fontWeight='bold'>
            {chain.currency} on {chain.name}
          </Typography>
          {typeof balanceNormalised !== 'undefined' && (
            <Typography variant='body2'>
              Balance: {balanceNormalised} {chain.currency}
            </Typography>
          )}
        </Stack>
      </Grid>
      <Grid>{!!selected && <DoneIcon />}</Grid>
    </Grid>
  );
}
