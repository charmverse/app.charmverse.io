'use client';

import { Paper, Typography, Box, Stack } from '@mui/material';
import Image from 'next/image';

import { BuilderCardNftDisplay } from 'components/common/Card/BuilderCard/BuilderCardNftDisplay';
import { useMdScreen } from 'hooks/useMediaScreens';

export function BuilderStats({
  avatar,
  username,
  builderPoints,
  totalScouts,
  totalNftsSold,
  currentNftPrice
}: {
  avatar?: string | null;
  username: string;
  builderPoints?: number;
  totalScouts?: number;
  totalNftsSold?: number;
  currentNftPrice?: number | bigint;
}) {
  const isDesktop = useMdScreen();
  return (
    <Paper
      sx={{
        py: 2,
        px: 4,
        display: 'flex',
        flexDirection: 'row',
        gap: 4,
        justifyContent: 'center'
      }}
    >
      <Box width={isDesktop ? 200 : 150}>
        <BuilderCardNftDisplay avatar={avatar} username={username} />
      </Box>
      <Stack justifyContent='space-between' gap={2}>
        <Stack justifyContent='center' gap={0.5}>
          <Typography fontWeight={500} color='secondary' variant='subtitle1' align='center'>
            THIS SEASON
          </Typography>
          <Stack flexDirection='row' gap={1} alignItems='center' justifyContent='center'>
            <Typography fontWeight={500} variant='h4' color='green.main'>
              {builderPoints || 0}
            </Typography>
            <Image src='/images/profile/scout-game-green-icon.svg' width='25' height='25' alt='scout game icon' />
          </Stack>
          <Typography fontWeight={500} variant='h4' color='green.main' align='center'>
            {totalScouts || 0} Scouts
          </Typography>
          <Stack flexDirection='row' gap={1} alignItems='center' justifyContent='center'>
            <Typography fontWeight={500} variant='h4' color='green.main'>
              {totalNftsSold || 0}
            </Typography>
            <Image src='/images/profile/icons/nft-green-icon.svg' width='25' height='25' alt='nft icon' />
            <Typography fontWeight={500} variant='h4' color='green.main'>
              Sold
            </Typography>
          </Stack>
        </Stack>
        <Stack justifyContent='center' gap={0.5}>
          <Typography fontWeight={500} color='secondary' variant='subtitle1' align='center'>
            CURRENT NFT PRICE
          </Typography>
          <Typography fontWeight={500} variant='h4' color='green.main' align='center'>
            ${currentNftPrice || 0}
          </Typography>
        </Stack>
      </Stack>
    </Paper>
  );
}
