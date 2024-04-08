import Box from '@mui/material/Box';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useController, type Control } from 'react-hook-form';

import type { FormValues } from './SpaceIntegrations';

export function SnapshotIntegration({ control, isAdmin }: { control: Control<FormValues>; isAdmin: boolean }) {
  const {
    field,
    fieldState: { error }
  } = useController({
    name: 'snapshotDomain',
    control
  });

  return (
    <Box>
      {!field.value && !isAdmin ? (
        <Typography>No Snapshot domain connected yet. Only space admins can configure this.</Typography>
      ) : (
        <TextField
          {...field}
          InputProps={{
            startAdornment: <InputAdornment position='start'>https://snapshot.org/</InputAdornment>
          }}
          disabled={!isAdmin}
          fullWidth
          error={!!error?.message}
          helperText={error?.message}
        />
      )}
    </Box>
  );
}
