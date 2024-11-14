import { Stack, Typography } from '@mui/material';
import Image from 'next/image';

export function PointsCell({ points }: { points: number }) {
  return (
    <Stack direction='row' alignItems='center' justifyContent='flex-end' gap={0.5}>
      <Typography>{points}</Typography>
      <Image alt='scout game icon' src='/images/profile/scout-game-icon.svg' width={20} height={20} />
    </Stack>
  );
}
