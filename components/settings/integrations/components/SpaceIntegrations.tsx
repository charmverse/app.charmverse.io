import type { Space } from '@charmverse/core/prisma-client';
import { yupResolver } from '@hookform/resolvers/yup';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import {
  useGetKycCredentials,
  useUpdateSpace,
  useUpdateKycCredentials,
  useDeleteKycCredentials
} from 'charmClient/hooks/spaces';
import { Button } from 'components/common/Button';
import FieldLabel from 'components/common/form/FieldLabel';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { getSnapshotSpace } from 'lib/snapshot/getSpace';
import { isTruthy } from 'lib/utils/types';

import { ConnectBoto } from './ConnectBoto';
import { ConnectCollabland } from './ConnectCollabland';
import { SnapshotIntegration } from './SnapshotDomain';
import { SpaceCompliance } from './SpaceKyc';

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
    }),
  synapsCredentialApiKey: yup.string(),
  synapsCredentialSecret: yup.string().nullable()
});

export type FormValues = yup.InferType<typeof schema>;

export function SpaceIntegrations({ space }: { space: Space }) {
  const isAdmin = useIsAdmin();
  const { refreshCurrentSpace } = useCurrentSpace();
  const { data: synapsCredential, mutate: mutateKycCredentials } = useGetKycCredentials(space.id);
  const { trigger: updateKycCredential, isMutating: kycCredentialsLoading } = useUpdateKycCredentials(space.id);
  const { trigger: deleteKycCredential } = useDeleteKycCredentials(space.id);
  const synapsCredentialApiKey = synapsCredential?.apiKey;
  const synapsCredentialSecret = synapsCredential?.secret;
  const { trigger: updateSpace, isMutating: updateSpaceLoading } = useUpdateSpace(space.id);
  const {
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { isDirty, dirtyFields }
  } = useForm<FormValues>({
    defaultValues: {
      snapshotDomain: space.snapshotDomain,
      synapsCredentialApiKey,
      synapsCredentialSecret
    },
    resolver: yupResolver(schema),
    mode: 'onSubmit'
  });

  useEffect(() => {
    if (synapsCredentialApiKey || synapsCredentialSecret) {
      setValue('synapsCredentialApiKey', synapsCredentialApiKey);
      setValue('synapsCredentialSecret', synapsCredentialSecret);
    }
  }, [synapsCredentialApiKey, synapsCredentialSecret]);

  const onSubmit = async (values: FormValues) => {
    if (!isAdmin || !isDirty) {
      return;
    }

    if (dirtyFields.snapshotDomain) {
      await updateSpace({ snapshotDomain: values.snapshotDomain }, { onSuccess: () => refreshCurrentSpace() });
    }

    // Delete synaps credential if the user doesn't want it anymore
    if (synapsCredential?.apiKey && !values.synapsCredentialApiKey) {
      await deleteKycCredential(undefined, { onSuccess: () => mutateKycCredentials() });
    }

    if ((dirtyFields.synapsCredentialApiKey || dirtyFields.synapsCredentialSecret) && values.synapsCredentialApiKey) {
      const synapsPayload = {
        apiKey: values.synapsCredentialApiKey ?? '',
        secret: values.synapsCredentialSecret ?? ''
      };

      await updateKycCredential({ ...synapsPayload }, { onSuccess: () => mutateKycCredentials() });
    }
    mutateKycCredentials();
  };

  const isLoading = updateSpaceLoading || kycCredentialsLoading;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={3} direction='column'>
        <Grid item>
          <FieldLabel>Snapshot.org domain</FieldLabel>
          <SnapshotIntegration control={control} isAdmin={isAdmin} />
        </Grid>
        <Grid item>
          <FieldLabel>Collab.Land</FieldLabel>
          <ConnectCollabland />
        </Grid>
        <Grid item>
          <FieldLabel>Send events to Discord/Telegram</FieldLabel>
          <ConnectBoto />
        </Grid>
        <Grid item>
          <SpaceCompliance control={control} isAdmin={isAdmin} />
        </Grid>
      </Grid>
      {isAdmin && (
        <Box
          sx={{
            py: 1,
            px: { xs: 5, md: 3 },
            position: 'sticky',
            mt: 3,
            bottom: '0',
            background: (theme) => theme.palette.background.paper,
            borderTop: (theme) => `1px solid ${theme.palette.divider}`,
            textAlign: 'right'
          }}
        >
          {isDirty && (
            <Button disableElevation variant='outlined' disabled={isLoading || !isDirty} onClick={reset} sx={{ mr: 2 }}>
              Cancel
            </Button>
          )}
          <Button disableElevation disabled={isLoading || !isDirty} type='submit' loading={isLoading}>
            Save
          </Button>
        </Box>
      )}
    </form>
  );
}
