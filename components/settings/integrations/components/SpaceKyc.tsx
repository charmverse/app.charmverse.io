import Box from '@mui/material/Box';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import type { Control } from 'react-hook-form';
import { useController } from 'react-hook-form';

import FieldLabel from 'components/common/form/FieldLabel';

import type { FormValues } from './SpaceIntegrations';

export function SpaceKyc({ isAdmin, control }: { isAdmin: boolean; control: Control<FormValues> }) {
  const {
    field: synapsApiKeyField,
    fieldState: { error: synapsApiKeyError }
  } = useController({
    name: 'synapsApiKey',
    control
  });

  const {
    field: synapsSecretField,
    fieldState: { error: synapsSecretError }
  } = useController({
    name: 'synapsSecret',
    control
  });

  const {
    field: personaApiKey,
    fieldState: { error: personaApiKeyError }
  } = useController({
    name: 'personaApiKey',
    control
  });

  const {
    field: personaSecret,
    fieldState: { error: personaSecretError }
  } = useController({
    name: 'personaSecret',
    control
  });

  const {
    field: personaTemplateId,
    fieldState: { error: personaTemplateIdError }
  } = useController({
    name: 'personaTemplateId',
    control
  });

  const {
    field: personaEnvironmentId,
    fieldState: { error: personaEnvironmentIdError }
  } = useController({
    name: 'personaEnvironmentId',
    control
  });

  const { field: kycOption } = useController({
    name: 'kycOption',
    control
  });

  return (
    <Box display='flex' flexWrap='wrap' flexDirection='column' mt={2} gap={2}>
      <Box>
        <FieldLabel>KYC</FieldLabel>
        <Typography variant='body2'>Choose your provider</Typography>
      </Box>
      <Box>
        <FormControlLabel
          control={
            <Switch
              name='snapsKyc'
              checked={kycOption.value === 'synaps'}
              value={kycOption.value === 'synaps'}
              onChange={(e) => {
                kycOption.onChange(e.target.checked ? 'synaps' : null);
              }}
            />
          }
          disabled={!isAdmin}
          labelPlacement='end'
          label='Enable Synaps.io KYC'
        />
        <FormControlLabel
          control={
            <Switch
              value={kycOption.value === 'persona'}
              checked={kycOption.value === 'persona'}
              onChange={(e) => {
                kycOption.onChange(e.target.checked ? 'persona' : null);
              }}
            />
          }
          disabled={!isAdmin}
          labelPlacement='end'
          label='Enable Persona KYC'
        />
      </Box>
      {kycOption.value === 'synaps' && (
        <>
          <Box>
            <FieldLabel>Synaps.io API key</FieldLabel>
            <TextField
              {...synapsApiKeyField}
              disabled={!isAdmin}
              fullWidth
              error={!!synapsApiKeyError?.message}
              helperText={synapsApiKeyError?.message}
            />
          </Box>
          <Box>
            <FieldLabel>Synaps.io Secret</FieldLabel>
            <TextField
              {...synapsSecretField}
              disabled={!isAdmin}
              fullWidth
              error={!!synapsSecretError?.message}
              helperText={synapsSecretError?.message}
            />
          </Box>
        </>
      )}
      {kycOption.value === 'persona' && (
        <>
          <Box>
            <FieldLabel>Persona API Key</FieldLabel>
            <TextField
              {...personaApiKey}
              disabled={!isAdmin}
              fullWidth
              error={!!personaApiKeyError?.message}
              helperText={personaApiKeyError?.message}
            />
          </Box>
          <Box>
            <FieldLabel>Persona Secret</FieldLabel>
            <TextField
              {...personaSecret}
              disabled={!isAdmin}
              fullWidth
              error={!!personaSecretError?.message}
              helperText={personaSecretError?.message}
            />
          </Box>
          <Box>
            <FieldLabel>Persona Template Id</FieldLabel>
            <TextField
              {...personaTemplateId}
              disabled={!isAdmin}
              fullWidth
              error={!!personaTemplateIdError?.message}
              helperText={personaTemplateIdError?.message}
            />
          </Box>
          <Box>
            <FieldLabel>Persona Environment Id</FieldLabel>
            <TextField
              {...personaEnvironmentId}
              disabled={!isAdmin}
              fullWidth
              error={!!personaEnvironmentIdError?.message}
              helperText={personaEnvironmentIdError?.message}
            />
          </Box>
        </>
      )}
    </Box>
  );
}
