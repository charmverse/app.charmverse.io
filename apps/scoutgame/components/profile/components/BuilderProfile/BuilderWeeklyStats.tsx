import { Paper, Stack, Typography } from '@mui/material';
import { currentSeason, getCurrentWeekNumber } from '@packages/scoutgame/utils';
import Image from 'next/image';

export function BuilderWeeklyStats({ gemsCollected, rank }: { gemsCollected?: number; rank?: number }) {
  const weekNumber = getCurrentWeekNumber();

  return (
    <Paper sx={{ p: 2, display: 'flex', flexDirection: 'row', gap: 2, justifyContent: 'space-between' }}>
      <Stack gap={1}>
        <Typography variant='h6'>SEASON {currentSeason}</Typography>
        <Typography variant='h5' fontWeight={500}>
          WEEK {weekNumber}
        </Typography>
      </Stack>
      <Stack gap={1}>
        <Typography color='secondary' variant='subtitle2'>
          COLLECTED
        </Typography>
        <Stack flexDirection='row' gap={1} alignItems='center' justifyContent='center'>
          <Typography variant='h4'>{gemsCollected || 0}</Typography>
          <Image width={25} height={25} src='/images/profile/icons/hex-gem-icon.svg' alt='Gem' />
        </Stack>
      </Stack>
      <Stack gap={1}>
        <Typography color='secondary' variant='subtitle2'>
          RANK
        </Typography>
        {/** TODO: Get actual rank for the builder */}
        <Typography variant='h4' align='center'>
          {rank || 'N/A'}
        </Typography>
      </Stack>
    </Paper>
  );
}
