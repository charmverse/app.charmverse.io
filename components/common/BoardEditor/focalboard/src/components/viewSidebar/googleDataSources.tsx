import { Card, Grid, Box, ListItemIcon, MenuItem, Typography } from '@mui/material';

import Button from 'components/common/Button';
import { useGoogleAuth } from 'hooks/useGoogleAuth';

export function GoogleForms() {
  const { loginWithGoogle } = useGoogleAuth({ scope: 'google_forms' });
  return (
    <Box px={3} mt={3}>
      <Button onClick={loginWithGoogle} variant='outlined'>
        Connect Google Account
      </Button>
      <Typography variant='caption'>Find and embed your Google forms</Typography>
    </Box>
  );
}
