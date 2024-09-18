import 'server-only';

import { Box, Typography } from '@mui/material';

export function HeaderMessage() {
  const message = 'Season 1 ends in 79 d 8 h 31m ';

  return (
    <Box width='100%' bgcolor='rgba(160, 108, 213, 0.4)' p={1}>
      <Typography variant='body1' fontWeight='500' textAlign='center'>
        {message}
      </Typography>
    </Box>
  );
}
