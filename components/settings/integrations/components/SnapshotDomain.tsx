import type { Space } from '@charmverse/core/prisma-client';
import { yupResolver } from '@hookform/resolvers/yup';
import Box from '@mui/material/Box';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import { useUpdateSpace } from 'charmClient/hooks/spaces';
import { Button } from 'components/common/Button';
import FieldLabel from 'components/common/form/FieldLabel';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { getSnapshotSpace } from 'lib/snapshot/getSpace';
import { isTruthy } from 'lib/utils/types';

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

  return (
    <Box>
      <Stack flexDirection='row' alignItems='center' gap={1}>
        {!space.snapshotDomain && !isAdmin ? (
          <Typography>No Snapshot domain connected yet. Only space admins can configure this.</Typography>
        ) : (
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
        )}
        {isAdmin && (
          <Button
            disabledTooltip={!isAdmin ? 'Only admins can change snapshot domain' : undefined}
            disableElevation
            disabled={!isAdmin || updateSpaceLoading || !isDirty}
            loading={updateSpaceLoading}
            onClick={updateSnapshotDomain}
          >
            Save
          </Button>
        )}
      </Stack>
    </Box>
  );
}
