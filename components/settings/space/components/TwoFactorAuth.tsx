import Box from '@mui/material/Box';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import { Controller } from 'react-hook-form';
import type { Control } from 'react-hook-form';

import type { FormValues } from '../SpaceSettings';

export function TwoFactorAuth({ isAdmin, control }: { isAdmin: boolean; control: Control<FormValues> }) {
  return (
    <Box display='flex' flexWrap='wrap' flexDirection='column'>
      <Controller
        name='requireMembersTwoFactorAuth'
        control={control}
        render={({ field }) => (
          <FormControlLabel
            control={<Switch {...field} checked={field.value} />}
            disabled={!isAdmin}
            sx={{ alignItems: 'flex-start' }}
            label={
              <Box>
                <Typography mt={1}>Require two-factor authentication</Typography>
                <Typography variant='caption'>
                  Require Members of this space to use a two-factor authentication app to log in.
                </Typography>
              </Box>
            }
          />
        )}
      />
    </Box>
  );
}
