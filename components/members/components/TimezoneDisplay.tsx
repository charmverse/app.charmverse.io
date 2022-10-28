import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { Typography } from '@mui/material';

import { convertTZ } from 'lib/utilities/browser';

export function TimezoneDisplay ({
  defaultValue = 'N/A',
  timezone
}: {
  timezone?: string | null;
  defaultValue?: string;
}) {
  return (
    <>
      <AccessTimeIcon fontSize='small' />
      <Typography variant='body2'>{timezone ? convertTZ(timezone) : defaultValue}</Typography>
    </>
  );
}
