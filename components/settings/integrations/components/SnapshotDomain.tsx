import type { Space } from '@charmverse/core/prisma';
import { yupResolver } from '@hookform/resolvers/yup';
import { Box, TextField } from '@mui/material';
import InputAdornment from '@mui/material/InputAdornment';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import { useUpdateSpace } from 'charmClient/hooks/spaces';
import { Button } from 'components/common/Button';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { getSnapshotSpace } from 'lib/snapshot/getSpace';
import { isTruthy } from 'lib/utils/types';

import { IntegrationContainer } from './IntegrationContainer';

const schema = yup.object({
  snapshotDomain: yup
    .string()
    .nullable()
    .min(3, 'Snapshot domain must be at least 3 characters')
    .test('checkDomain', 'Snapshot domain not found', async (domain) => {
      if (domain) {
        const foundSpace = await getSnapshotSpace(domain);
        return isTruthy(foundSpace);
      }
      return true;
    })
});

type FormValues = yup.InferType<typeof schema>;

export function SnapshotIntegration({ isAdmin, space }: { isAdmin: boolean; space: Space }) {
  const { trigger: updateSpace, isMutating: updateSpaceLoading } = useUpdateSpace(space.id);
  const { refreshCurrentSpace } = useCurrentSpace();
  const [expanded, setExpanded] = useState(false);
  const {
    getValues,
    register,
    formState: { isDirty, errors }
  } = useForm<FormValues>({
    defaultValues: {
      snapshotDomain: space.snapshotDomain || ''
    },
    resolver: yupResolver(schema),
    mode: 'onSubmit'
  });

  const updateSnapshotDomain = async () => {
    const values = getValues();
    if (isDirty && isAdmin) {
      await updateSpace({ snapshotDomain: values.snapshotDomain || null }, { onSuccess: () => refreshCurrentSpace() });
    }
  };

  const isConnected = !!space.snapshotDomain;

  return (
    <IntegrationContainer
      expanded={expanded}
      setExpanded={setExpanded}
      isConnected={isConnected}
      disableConnectTooltip={!isAdmin ? 'Only an admin can change Snapshot domain' : undefined}
      connectedSummary={
        <>
          Connected to <strong>{space.snapshotDomain}</strong>
        </>
      }
      title='Snapshot.org domain'
    >
      <Box display='flex' gap={2} flexDirection='column'>
        <TextField
          {...register('snapshotDomain')}
          InputProps={{
            startAdornment: <InputAdornment position='start'>https://snapshot.org/</InputAdornment>
          }}
          disabled={!isAdmin}
          fullWidth
          error={!!errors.snapshotDomain?.message}
          helperText={errors.snapshotDomain?.message}
        />
        <Box display='flex' justifyContent='flex-end'>
          <Button
            disabledTooltip={!isAdmin ? 'Only admins can change snapshot domain' : undefined}
            disableElevation
            disabled={!isAdmin || updateSpaceLoading || !isDirty}
            loading={updateSpaceLoading}
            onClick={updateSnapshotDomain}
          >
            Save
          </Button>
        </Box>
      </Box>
    </IntegrationContainer>
  );
}
