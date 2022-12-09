import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { Stack, Typography } from '@mui/material';
import { DateTime } from 'luxon';

export function TimezoneDisplay({
  defaultValue = 'N/A',
  timezone,
  showTimezone = false
}: {
  timezone?: string | null;
  defaultValue?: string;
  showTimezone?: boolean;
}) {
  return (
    <Stack flexDirection='row' gap={1}>
      <AccessTimeIcon fontSize='small' />
      <Stack flexDirection='row' gap={0.5}>
        <Typography variant='body2'>
          {timezone ? DateTime.local().setZone(timezone).toFormat('hh:mm a') : defaultValue}
        </Typography>
        {showTimezone && timezone && (
          <Typography color='secondary' fontWeight='bold' variant='body2'>
            ({timezone})
          </Typography>
        )}
      </Stack>
    </Stack>
  );
}
