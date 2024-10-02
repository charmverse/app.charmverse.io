import { Paper, Stack, Typography } from '@mui/material';
import Image from 'next/image';

export function PublicScoutProfileStats({
  allTimePoints,
  seasonPoints,
  buildersScouted,
  nftsPurchased
}: {
  allTimePoints: number;
  seasonPoints: number;
  buildersScouted: number;
  nftsPurchased: number;
}) {
  return (
    <Paper sx={{ p: 2 }}>
      <Typography paddingY={1} variant='subtitle1' textAlign='center' color='secondary'>
        THIS SEASON (ALL TIME)
      </Typography>
      <Stack flexDirection='row' justifyContent='space-between' gap={2}>
        <Stack flexDirection='row' gap={0.5}>
          <Typography color='orange.main' variant='subtitle2'>
            {seasonPoints}
          </Typography>
          <Image src='/images/profile/scout-game-orange-icon.svg' width='20' height='20' alt='scout game icon' />
          <Typography color='orange.main' variant='subtitle2'>
            ({allTimePoints})
          </Typography>
        </Stack>
        <Typography color='orange.main' variant='subtitle2'>
          {buildersScouted} Builders
        </Typography>
        <Stack flexDirection='row' gap={0.5}>
          <Typography color='orange.main' variant='subtitle2'>
            {nftsPurchased}
          </Typography>
          <Image src='/images/profile/icons/nft-orange-icon.svg' width='20' height='20' alt='nft icon' />
          <Typography color='orange.main' variant='subtitle2'>
            Held
          </Typography>
        </Stack>
      </Stack>
    </Paper>
  );
}
