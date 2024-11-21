import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Stack, Link as MuiLink } from '@mui/material';
import type { ISOWeek } from '@packages/scoutgame/dates';
import { getCurrentSeasonWeekNumber, getCurrentWeek, getNextWeek, getPreviousWeek } from '@packages/scoutgame/dates';
import Link from 'next/link';

export function WeekTableHead({ week = getCurrentWeek() }: { week?: ISOWeek }) {
  const currentWeek = getCurrentWeek();
  const weekNumber = getCurrentSeasonWeekNumber(week);

  return (
    <Stack alignItems='center' flexDirection='row' sx={{ '& svg': { display: 'block' } }}>
      {weekNumber > 1 && (
        <MuiLink
          component={Link}
          href={{
            query: {
              week: getPreviousWeek(week)
            }
          }}
        >
          <ChevronLeftIcon />
        </MuiLink>
      )}
      <span>WEEK {weekNumber}</span>
      {currentWeek !== week && (
        <MuiLink
          component={Link}
          href={{
            query: {
              week: getNextWeek(week)
            }
          }}
        >
          <ChevronRightIcon />
        </MuiLink>
      )}
    </Stack>
  );
}
