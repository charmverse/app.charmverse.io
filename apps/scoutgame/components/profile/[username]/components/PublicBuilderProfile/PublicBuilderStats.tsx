import { Stack, Typography } from '@mui/material';
import Image from 'next/image';

export function PublicBuilderStats({
  allTimePoints,
  seasonPoints,
  totalScouts,
  totalNftsSold
}: {
  seasonPoints: number;
  allTimePoints: number;
  totalScouts: number;
  totalNftsSold: number;
}) {
  return (
    <Stack gap={0.5}>
      <Typography fontWeight={500} color='secondary' variant='subtitle1'>
        THIS SEASON (ALL TIME)
      </Typography>
      <Stack flexDirection='row' gap={1} alignItems='center'>
        <Typography fontWeight={500} variant='h5' color='green.main'>
          {seasonPoints}
        </Typography>
        <Image src='/images/profile/scout-game-green-icon.svg' width='25' height='25' alt='scout game icon' />
        <Typography fontWeight={500} variant='h6' color='green.main'>
          ({allTimePoints})
        </Typography>
      </Stack>
      <Typography fontWeight={500} variant='h5' color='green.main'>
        {totalScouts} Scouts
      </Typography>
      <Stack flexDirection='row' gap={1} alignItems='center'>
        <Typography fontWeight={500} variant='h5' color='green.main'>
          {totalNftsSold}
        </Typography>
        <Image src='/images/profile/icons/nft-green-icon.svg' width='25' height='25' alt='nft icon' />
        <Typography fontWeight={500} variant='h5' color='green.main'>
          Sold
        </Typography>
      </Stack>
    </Stack>
  );
}
