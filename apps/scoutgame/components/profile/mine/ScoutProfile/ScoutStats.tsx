import { Paper, Stack, Typography } from '@mui/material';
import Image from 'next/image';

export function ScoutStats({
  scoutPoints,
  buildersScouted,
  nftsPurchased
}: {
  scoutPoints: number;
  buildersScouted: number;
  nftsPurchased: number;
}) {
  return (
    <Paper sx={{ p: 2 }}>
      <Typography paddingY={1} variant='subtitle2' textAlign='center' color='secondary'>
        THIS SEASON
      </Typography>
      <Stack flexDirection='row' justifyContent='space-between'>
        <Stack flexDirection='row' gap={1}>
          <Typography color='orange.main'>{scoutPoints}</Typography>
          <Image src='/images/profile/scout-game-orange-icon.svg' width='25' height='25' alt='scout game icon' />
        </Stack>
        <Typography color='orange.main'>{buildersScouted} Builders</Typography>
        <Stack flexDirection='row' gap={1}>
          <Typography color='orange.main'>{nftsPurchased}</Typography>
          <Image src='/images/profile/icons/nft-orange-icon.svg' width='25' height='25' alt='nft icon' />
        </Stack>
      </Stack>
    </Paper>
  );
}
