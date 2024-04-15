import type { KycOption, Space } from '@charmverse/core/prisma-client';
import { yupResolver } from '@hookform/resolvers/yup';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import { useGetKycCredentials, useUpdateSpace, useUpdateKycCredentials } from 'charmClient/hooks/spaces';
import { Button } from 'components/common/Button';
import FieldLabel from 'components/common/form/FieldLabel';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useIsCharmverseSpace } from 'hooks/useIsCharmverseSpace';
import type { KycCredentials } from 'lib/kyc/getKycCredentials';
import { getSnapshotSpace } from 'lib/snapshot/getSpace';
import { isTruthy } from 'lib/utils/types';

import { ConnectBoto } from './ConnectBoto';
import { ConnectCollabland } from './ConnectCollabland';
import { ConnectGithubApp } from './ConnectGithubApp';
import { SnapshotIntegration } from './SnapshotDomain';
import { SpaceKyc } from './SpaceKyc';
import { SynapsModal } from './SynapsModal';

const PersonaModal = dynamic(() => import('./PersonaModal'), { ssr: false });

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
  synapsApiKey: yup.string(),
  synapsSecret: yup.string().nullable(),
  personaApiKey: yup.string().nullable(),
  personaSecret: yup.string().nullable(),
  personaTemplateId: yup.string().nullable(),
  personaEnvironmentId: yup.string().nullable(),
  kycOption: yup.string().oneOf<KycOption>(['synaps', 'persona']).nullable()
});

export type FormValues = yup.InferType<typeof schema>;

export function SpaceIntegrations({ space }: { space: Space }) {
  const isAdmin = useIsAdmin();
  const { refreshCurrentSpace } = useCurrentSpace();
  const { data: kycCredentials, mutate: mutateKycCredentials } = useGetKycCredentials(space.id);
  const { trigger: updateKycCredential, isMutating: kycUpdateCredentialsLoading } = useUpdateKycCredentials(space.id);
  const { trigger: updateSpace, isMutating: updateSpaceLoading } = useUpdateSpace(space.id);
  const isCharmverseSpace = useIsCharmverseSpace();
  const {
    handleSubmit,
    control,
    reset,
    formState: { isDirty, dirtyFields }
  } = useForm<FormValues>({
    defaultValues: {
      snapshotDomain: space.snapshotDomain,
      kycOption: space.kycOption
    },
    resolver: yupResolver(schema),
    mode: 'onSubmit'
  });

  useEffect(() => {
    reset(getDefaultValues({ kycCredentials, space }));
  }, [
    kycCredentials?.synaps?.apiKey,
    kycCredentials?.synaps?.secret,
    kycCredentials?.persona?.apiKey,
    kycCredentials?.persona?.secret,
    kycCredentials?.persona?.templateId,
    kycCredentials?.persona?.envId
  ]);

  const onSubmit = async (values: FormValues) => {
    if (!isAdmin || !isDirty) {
      return;
    }

    if (dirtyFields.snapshotDomain || dirtyFields.kycOption) {
      await updateSpace(
        {
          snapshotDomain: values.snapshotDomain,
          kycOption: values.kycOption || null
        },
        { onSuccess: () => refreshCurrentSpace() }
      );
    }

    if (
      dirtyFields.synapsApiKey ||
      dirtyFields.synapsSecret ||
      dirtyFields.personaApiKey ||
      dirtyFields.personaSecret ||
      dirtyFields.personaTemplateId ||
      dirtyFields.personaEnvironmentId
    ) {
      const synapsPayload: KycCredentials = {
        synaps: {
          spaceId: space.id,
          apiKey: values.synapsApiKey ?? '',
          secret: values.synapsSecret ?? ''
        },
        persona: {
          spaceId: space.id,
          apiKey: values.personaApiKey ?? '',
          secret: values.personaSecret ?? '',
          envId: values.personaEnvironmentId ?? '',
          templateId: values.personaTemplateId ?? ''
        }
      };

      await updateKycCredential({ ...synapsPayload }, { onSuccess: (data) => mutateKycCredentials(data) });
    }
  };

  const isLoading = updateSpaceLoading || kycUpdateCredentialsLoading;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      style={{
        position: 'relative'
      }}
    >
      <Grid container spacing={3} direction='column'>
        <Grid item>
          <FieldLabel>Snapshot.org domain</FieldLabel>
          <Stack flexDirection='row' alignItems='center' gap={1}>
            <Box width='100%'>
              <SnapshotIntegration control={control} isAdmin={isAdmin} />
            </Box>
            <Button
              disabledTooltip={!isAdmin ? 'Only admins can change snapshot domain' : undefined}
              disableElevation
              disabled={!isAdmin || updateSpaceLoading || !isDirty}
              type='submit'
              loading={updateSpaceLoading}
            >
              Save
            </Button>
          </Stack>
        </Grid>
        <Grid item>
          <FieldLabel>Collab.Land</FieldLabel>
          <ConnectCollabland />
        </Grid>
        <Grid item>
          <FieldLabel>Send events to Discord/Telegram</FieldLabel>
          <ConnectBoto />
        </Grid>
        {isCharmverseSpace && (
          <Grid item>
            <FieldLabel>Sync with Github Repo</FieldLabel>
            <ConnectGithubApp spaceId={space.id} spaceDomain={space.domain} />
          </Grid>
        )}
        {kycCredentials && (
          <Grid item>
            <SpaceKyc control={control} isAdmin={isAdmin} />
          </Grid>
        )}
        {isCharmverseSpace && isAdmin && space.kycOption === 'synaps' && kycCredentials?.synaps?.apiKey && (
          <Grid item>
            <SynapsModal spaceId={space.id} />
          </Grid>
        )}
        {isCharmverseSpace &&
          isAdmin &&
          space.kycOption === 'persona' &&
          kycCredentials?.persona?.apiKey &&
          kycCredentials.persona.envId &&
          kycCredentials.persona.templateId && (
            <Grid item>
              <PersonaModal spaceId={space.id} />
            </Grid>
          )}
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

function getDefaultValues({ kycCredentials, space }: { kycCredentials?: KycCredentials; space: Space }) {
  return {
    synapsApiKey: kycCredentials?.synaps?.apiKey ?? '',
    synapsSecret: kycCredentials?.synaps?.secret ?? '',
    personaApiKey: kycCredentials?.persona?.apiKey ?? '',
    personaSecret: kycCredentials?.persona?.secret ?? '',
    personaTemplateId: kycCredentials?.persona?.templateId ?? '',
    personaEnvironmentId: kycCredentials?.persona?.envId ?? '',
    kycOption: space.kycOption,
    snapshotDomain: space.snapshotDomain
  };
}
