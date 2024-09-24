import { Stack, Typography } from '@mui/material';
import Image from 'next/image';

import type { BuilderMetrics } from 'lib/builders/interfaces';

export function UserCardDetails({ gems, scoutedBy, nftsSold }: Partial<BuilderMetrics>) {
  return (
    <Stack flexDirection='row' alignItems='center' justifyContent='space-between' gap={1}>
      {typeof gems === 'number' && (
        <Stack flexDirection='row' gap={0.2} alignItems='center'>
          <Typography variant='body2' component='span' color='text.secondary'>
            {gems}
          </Typography>
          <Image width={15} height={15} src='/images/profile/icons/hex-gem-icon.svg' alt='Gem' />
        </Stack>
      )}
      {typeof scoutedBy === 'number' && (
        <Stack flexDirection='row' gap={0.2} alignItems='center'>
          <Typography variant='body2' component='span' color='green.main'>
            {scoutedBy}
          </Typography>
          <Image width={15} height={15} src='/images/profile/icons/scout-icon.svg' alt='Scouts' />
        </Stack>
      )}
      {typeof nftsSold === 'number' && (
        <Stack flexDirection='row' gap={0.2} alignItems='center'>
          <Typography variant='body2' component='span' color='orange.main'>
            {nftsSold}
          </Typography>
          <Image width={12} height={12} src='/images/profile/icons/nft-orange-icon.svg' alt='Nfts' />
        </Stack>
      )}
    </Stack>
  );
}
