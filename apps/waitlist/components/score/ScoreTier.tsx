'use client';

import type { ConnectWaitlistSlot } from '@charmverse/core/prisma-client';
import { Box, Stack, Typography } from '@mui/material';
import Image from 'next/image';

import { Counter } from 'components/common/Counter';
import { getTier, tierDistributionMap } from 'lib/scoring/constants';

export function ScoreTier({ waitlistSlot }: { waitlistSlot: ConnectWaitlistSlot & { clicks: number } }) {
  const tier = getTier(waitlistSlot?.percentile);
  const badgeImage = tierDistributionMap[tier].badgeText;
  return (
    <Stack flexDirection='row' justifyContent='space-between'>
      <Box>
        <Typography mb={2} variant='h6' paragraph>
          Current Tier
        </Typography>
        <Box>
          <Image
            src={badgeImage}
            width={120}
            height={120}
            sizes='100vw'
            style={{
              width: '100%',
              maxWidth: '1000px',
              height: 'auto'
            }}
            alt='Current tier'
          />
        </Box>
      </Box>
      <Box>
        <Typography mb={2} variant='h6' paragraph>
          Percentile
        </Typography>
        <Typography mb={2} variant='h3' paragraph fontWeight='700'>
          <Counter to={waitlistSlot.percentile ?? 0} />%
        </Typography>
        <Typography mb={1} variant='h6' paragraph>
          Frame clicks
        </Typography>
        <Typography variant='h3' paragraph fontWeight='700'>
          <Counter to={waitlistSlot.clicks ?? 0} />
        </Typography>
      </Box>
    </Stack>
  );
}
