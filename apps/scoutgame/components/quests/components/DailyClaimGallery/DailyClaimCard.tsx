import { Stack, Typography } from '@mui/material';
import Image from 'next/image';

import type { DailyClaim } from 'lib/users/getDailyClaims';

export function DailyClaimCard({ dailyClaim }: { dailyClaim: DailyClaim }) {
  return (
    <Stack
      sx={{
        backgroundColor: 'background.paper',
        width: '100%',
        height: 100,
        borderRadius: 1,
        alignItems: 'center',
        position: 'relative'
      }}
    >
      <Stack direction='row' justifyContent='center' alignItems='center' gap={0.5} flex={1}>
        <Typography variant='h5' fontWeight={600}>
          +1
        </Typography>
        <Image src='/images/profile/scout-game-profile-icon.png' alt='Scout game icon' width={22.5} height={13.5} />
      </Stack>
      <Typography variant='body2' position='absolute' bottom={10}>
        Day {dailyClaim.day}
      </Typography>
    </Stack>
  );
}
