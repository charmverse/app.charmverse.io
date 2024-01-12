import Box from '@mui/material/Box';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import type { UseFormRegister } from 'react-hook-form';

import { useIsCharmverseSpace } from 'hooks/useIsCharmverseSpace';

import type { FormValues } from '../SpaceSettings';

export function TwoFactorAuth({ isAdmin, register }: { isAdmin: boolean; register: UseFormRegister<FormValues> }) {
  const isCharmverse = useIsCharmverseSpace();

  if (!isCharmverse) {
    return null;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <Box display='flex' flexWrap='wrap' flexDirection='column'>
      <FormControlLabel
        control={<Switch />}
        sx={{ alignItems: 'flex-start' }}
        label={
          <Box>
            <Typography mt={1}>Require two-factor authentication</Typography>
            <Typography variant='caption'>
              Require Members of this space to use a two-factor authentication app to log in.
            </Typography>
          </Box>
        }
        {...register('requireMembersTwoFactorAuth')}
      />
    </Box>
  );
}
