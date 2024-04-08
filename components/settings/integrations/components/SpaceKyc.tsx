import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import type { Control } from 'react-hook-form';
import { useController } from 'react-hook-form';

import FieldLabel from 'components/common/form/FieldLabel';
import type { KycCredentials } from 'lib/kyc/getKycCredentials';
import { capitalize } from 'lib/utils/strings';
import { isTruthy } from 'lib/utils/types';

import type { FormValues } from './SpaceIntegrations';

export function SpaceKyc({
  isAdmin,
  control,
  kycCredentials
}: {
  isAdmin: boolean;
  control: Control<FormValues>;
  kycCredentials?: KycCredentials;
}) {
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

  const { field: kycOptionField } = useController({
    name: 'kycOption',
    control
  });

  const synapsOption = kycCredentials?.synaps?.apiKey ? 'synaps' : undefined;
  const personaOption = kycCredentials?.persona?.apiKey ? 'persona' : undefined;
  const options = [synapsOption, personaOption].filter(isTruthy);

  return (
    <Box display='flex' flexWrap='wrap' flexDirection='column' mt={2} gap={2}>
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
      {(kycCredentials?.synaps?.apiKey || kycCredentials?.persona?.apiKey) && options.length > 0 && (
        <Box>
          <FieldLabel id='select-kyc-service-label'>Select your default KYC service</FieldLabel>
          <Select
            labelId='select-kyc-service-label'
            id='select-kyc-service'
            displayEmpty
            renderValue={(selected) => capitalize(selected) || 'None'}
            {...kycOptionField}
          >
            <MenuItem value={undefined}>None</MenuItem>
            {options.map((option) => (
              <MenuItem key={option} value={option}>
                {capitalize(option)}
              </MenuItem>
            ))}
          </Select>
        </Box>
      )}
    </Box>
  );
}
