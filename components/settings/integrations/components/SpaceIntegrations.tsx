import type { KycOption, Space } from '@charmverse/core/prisma-client';
import { yupResolver } from '@hookform/resolvers/yup';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
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
import { SnapshotIntegration } from './SnapshotDomain';
import { SpaceKyc } from './SpaceKyc';
import { SynapsModal } from './SynapsModal';

const PersonaModalWithConfirmationWithoutSSR = dynamic(() => import('./PersonaModal'), {
  ssr: false
});

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
  const isAllowedSpace = useIsCharmverseSpace();
  const {
    handleSubmit,
    reset,
    control,
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
    reset(getDefaultValues(kycCredentials));
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
          <SpaceKyc control={control} isAdmin={isAdmin} kycCredentials={kycCredentials} />
        </Grid>
        {isAllowedSpace && space.kycOption === 'synaps' && kycCredentials?.synaps?.apiKey && (
          <Grid item>
            <SynapsModal spaceId={space.id} />
          </Grid>
        )}
        {isAllowedSpace &&
          space.kycOption === 'persona' &&
          kycCredentials?.persona?.apiKey &&
          kycCredentials.persona.envId &&
          kycCredentials.persona.templateId && (
            <Grid item>
              <PersonaModalWithConfirmationWithoutSSR
                spaceId={space.id}
                templateId={kycCredentials.persona.templateId}
                environmentId={kycCredentials.persona.envId}
              />
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

function getDefaultValues(kycCredentials?: KycCredentials) {
  return {
    synapsApiKey: kycCredentials?.synaps?.apiKey ?? '',
    synapsSecret: kycCredentials?.synaps?.secret ?? '',
    personaApiKey: kycCredentials?.persona?.apiKey ?? '',
    personaSecret: kycCredentials?.persona?.secret ?? '',
    personaTemplateId: kycCredentials?.persona?.templateId ?? '',
    personaEnvironmentId: kycCredentials?.persona?.envId ?? ''
  };
}
