import Box from '@mui/material/Box';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import { Controller } from 'react-hook-form';
import type { Control } from 'react-hook-form';

import type { FormValues } from '../SpaceSettings';

export function BlockchainSettings({ isAdmin, control }: { isAdmin: boolean; control: Control<FormValues> }) {
  return (
    <Box display='flex' flexWrap='wrap' flexDirection='column'>
      <Controller
        name='enableTestnets'
        control={control}
        render={({ field }) => (
          <FormControlLabel
            control={<Switch {...field} checked={field.value} />}
            disabled={!isAdmin}
            sx={{ alignItems: 'flex-start' }}
            label={
              <Box>
                <Typography mt={1}>Enable testnets</Typography>
              </Box>
            }
          />
        )}
      />
    </Box>
  );
}
