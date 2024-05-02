import type { KycOption } from '@charmverse/core/prisma-client';
import { Typography } from '@mui/material';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import type { Control } from 'react-hook-form';
import { useController } from 'react-hook-form';

import FieldLabel from 'components/common/form/FieldLabel';
import Link from 'components/common/Link';
import { capitalize } from 'lib/utils/strings';

import type { FormValues } from './KYCSettings';

export function KycIntegrationFields({ isAdmin, control }: { isAdmin: boolean; control: Control<FormValues> }) {
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

  const { field: kycOption } = useController({
    name: 'kycOption',
    control
  });

  return (
    <Box display='flex' flexWrap='wrap' flexDirection='column' gap={2}>
      <Box>
        <Select<KycOption | null>
          {...kycOption}
          displayEmpty
          value={kycOption.value || ''}
          disabled={!isAdmin}
          renderValue={(val) => (val ? capitalize(val) : 'None')}
        >
          <MenuItem value=''>None</MenuItem>
          <MenuItem value='synaps'>Synaps</MenuItem>
          <MenuItem value='persona'>Persona</MenuItem>
        </Select>
      </Box>
      {kycOption.value === 'synaps' && (
        <>
          <Box>
            <FieldLabel>API key</FieldLabel>
            <TextField
              {...synapsApiKeyField}
              disabled={!isAdmin}
              fullWidth
              error={!!synapsApiKeyError?.message}
              helperText={synapsApiKeyError?.message}
            />
            <Typography variant='caption'>
              {'Select an api key from: Synaps Manager > Integration > Credential'}
            </Typography>
          </Box>
          <Box>
            <FieldLabel>Webhook Secret</FieldLabel>
            <TextField
              {...synapsSecretField}
              disabled={!isAdmin}
              fullWidth
              error={!!synapsSecretError?.message}
              helperText={synapsSecretError?.message}
            />
            <Typography variant='caption'>{'Select a secret from: Synaps Manager > Integration > Webhook'}</Typography>
          </Box>
        </>
      )}
      {kycOption.value === 'persona' && (
        <>
          <Box>
            <FieldLabel>API Key</FieldLabel>
            <TextField
              {...personaApiKey}
              disabled={!isAdmin}
              fullWidth
              error={!!personaApiKeyError?.message}
              helperText={personaApiKeyError?.message}
            />
            <Typography variant='caption'>
              Select an api key from:{' '}
              <Link color='inherit' href='https://app.withpersona.com/dashboard/api-keys' external>
                https://app.withpersona.com/dashboard/api-keys
              </Link>
            </Typography>
          </Box>
          <Box>
            <FieldLabel>Webhook Secret</FieldLabel>
            <TextField
              {...personaSecret}
              disabled={!isAdmin}
              fullWidth
              error={!!personaSecretError?.message}
              helperText={personaSecretError?.message}
            />
            <Typography variant='caption'>
              Select a secret from:{' '}
              <Link color='inherit' href='https://app.withpersona.com/dashboard/webhooks' external>
                https://app.withpersona.com/dashboard/webhooks
              </Link>
            </Typography>
          </Box>
          <Box>
            <FieldLabel>Template Id</FieldLabel>
            <TextField
              {...personaTemplateId}
              disabled={!isAdmin}
              fullWidth
              error={!!personaTemplateIdError?.message}
              helperText={personaTemplateIdError?.message}
            />
            <Typography variant='caption'>
              Select a template from:{' '}
              <Link color='inherit' href='https://app.withpersona.com/dashboard/inquiry-templates' external>
                https://app.withpersona.com/dashboard/inquiry-templates
              </Link>
            </Typography>
          </Box>
        </>
      )}
    </Box>
  );
}
