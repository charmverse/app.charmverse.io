import Box from '@mui/material/Box';
import FormControlLabel from '@mui/material/FormControlLabel';
import type { FormControlLabelProps } from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';

import { useIsCharmverseSpace } from 'hooks/useIsCharmverseSpace';

export function TwoFactorAuth({
  isAdmin,
  ...props
}: Omit<FormControlLabelProps, 'label' | 'control'> & { isAdmin: boolean }) {
  const isCharmverse = useIsCharmverseSpace();

  if (!isCharmverse || !isAdmin) {
    return null;
  }

  return (
    <FormControlLabel
      {...props}
      control={<Switch />}
      sx={{ alignItems: 'flex-start' }}
      label={
        <Box>
          <Typography>Require two-factor authentication</Typography>
          <Typography variant='caption'>
            Require Members of this space to use a two-factor authentication app to log in.
          </Typography>
        </Box>
      }
    />
  );
}
