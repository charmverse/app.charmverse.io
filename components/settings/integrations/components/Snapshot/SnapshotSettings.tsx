import type { Space } from '@charmverse/core/prisma';
import { yupResolver } from '@hookform/resolvers/yup';
import { Box, Stack, TextField } from '@mui/material';
import InputAdornment from '@mui/material/InputAdornment';
import { isTruthy } from '@packages/utils/types';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import { useUpdateSpace } from 'charmClient/hooks/spaces';
import { Button } from 'components/common/Button';
import FieldLabel from 'components/common/form/FieldLabel';
import { useConfirmationModal } from 'hooks/useConfirmationModal';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';
import { getSnapshotSpace } from 'lib/snapshot/getSpace';

import { IntegrationContainer } from '../IntegrationContainer';

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

export function SnapshotSettings({ isAdmin, space }: { isAdmin: boolean; space: Space }) {
  const { trigger: updateSpace, isMutating: updateSpaceLoading } = useUpdateSpace(space.id);
  const { refreshCurrentSpace } = useCurrentSpace();
  const [expanded, setExpanded] = useState(false);
  const { showError } = useSnackbar();
  const { showConfirmation } = useConfirmationModal();
  const {
    getValues,
    register,
    reset,
    formState: { isDirty, errors }
  } = useForm<FormValues>({
    defaultValues: {
      snapshotDomain: space.snapshotDomain || ''
    },
    resolver: yupResolver(schema),
    mode: 'onSubmit'
  });

  const isConnected = !!space.snapshotDomain;

  async function updateSnapshotDomain() {
    const values = getValues();
    if (isDirty && isAdmin) {
      try {
        await updateSpace({ snapshotDomain: values.snapshotDomain || null }, { onSuccess: refreshCurrentSpace });
      } catch (error) {
        showError(error, 'Error updating Snapshot domain');
      }
    }
  }

  function clearDomain() {
    showConfirmation({
      message: 'Clear the Snapshot domain?',
      confirmButton: 'Disconnect',
      onConfirm: () => updateSpace({ snapshotDomain: null }, { onSuccess: refreshCurrentSpace })
    });
  }

  useEffect(() => {
    reset({
      snapshotDomain: space.snapshotDomain || ''
    });
  }, [space?.snapshotDomain, reset]);

  return (
    <IntegrationContainer
      title='Snapshot.org'
      subheader='Publish votes to Snapshot'
      expanded={expanded}
      setExpanded={setExpanded}
      isAdmin={isAdmin}
      isConnected={isConnected}
      onCancel={() => reset({ snapshotDomain: space.snapshotDomain || '' })}
    >
      <Stack gap={2}>
        <div>
          <FieldLabel>Snapshot domain</FieldLabel>
          <TextField
            autoFocus
            placeholder='your-domain.eth'
            {...register('snapshotDomain')}
            InputProps={{
              startAdornment: <InputAdornment position='start'>https://snapshot.org/</InputAdornment>
            }}
            disabled={!isAdmin}
            fullWidth
            error={!!errors.snapshotDomain?.message}
            helperText={errors.snapshotDomain?.message}
          />
        </div>
        <Box display='flex' justifyContent='flex-start' gap={2}>
          <Button
            disabledTooltip={!isAdmin ? 'Only admins can change snapshot domain' : undefined}
            disableElevation
            disabled={!isAdmin || updateSpaceLoading || !isDirty}
            loading={updateSpaceLoading}
            onClick={updateSnapshotDomain}
          >
            Save
          </Button>
          {isConnected && (
            <Button color='error' variant='outlined' onClick={clearDomain}>
              Disconnect
            </Button>
          )}
        </Box>
      </Stack>
    </IntegrationContainer>
  );
}
