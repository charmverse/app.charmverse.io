import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import type { Control } from 'react-hook-form';
import { useController } from 'react-hook-form';

import FieldLabel from 'components/common/form/FieldLabel';

import type { FormValues } from './SpaceIntegrations';

export function SpaceCompliance({ isAdmin, control }: { isAdmin: boolean; control: Control<FormValues> }) {
  const {
    field: apiKeyField,
    fieldState: { error: apiKeyError }
  } = useController({
    name: 'synapsCredentialApiKey',
    control
  });

  const {
    field: secretField,
    fieldState: { error: secretError }
  } = useController({
    name: 'synapsCredentialSecret',
    control
  });

  return (
    <Box display='flex' flexWrap='wrap' flexDirection='column' mt={2} gap={2}>
      <Box>
        <FieldLabel>Synaps.io API key</FieldLabel>
        <TextField
          {...apiKeyField}
          disabled={!isAdmin}
          fullWidth
          error={!!apiKeyError?.message}
          helperText={apiKeyError?.message}
        />
      </Box>
      <Box>
        <FieldLabel>Synaps.io Secret</FieldLabel>
        <TextField
          {...secretField}
          disabled={!isAdmin}
          fullWidth
          error={!!secretError?.message}
          helperText={secretError?.message}
        />
      </Box>
    </Box>
  );
}
