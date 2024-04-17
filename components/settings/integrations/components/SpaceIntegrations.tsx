import type { KycOption, Space } from '@charmverse/core/prisma-client';
import { yupResolver } from '@hookform/resolvers/yup';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
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

import { ConnectBoto } from './ConnectBoto';
import { ConnectCollabland } from './ConnectCollabland';
import { ConnectGithubApp } from './ConnectGithubApp';
import { SnapshotIntegration } from './SnapshotDomain';
import { SpaceKyc } from './SpaceKyc';
import { SynapsModal } from './SynapsModal';

const PersonaModal = dynamic(() => import('./PersonaModal'), { ssr: false });

const schema = yup.object({
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
    defaultValues: getDefaultValues({ kycCredentials, space }),
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

    if (dirtyFields.kycOption) {
      await updateSpace({ kycOption: values.kycOption || null }, { onSuccess: () => refreshCurrentSpace() });
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

  const resetValues = () => reset(getDefaultValues({ kycCredentials, space }));

  const isLoading = updateSpaceLoading || kycUpdateCredentialsLoading;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={3} direction='column'>
        <Grid item>
          <FieldLabel>Snapshot.org domain</FieldLabel>
          <SnapshotIntegration isAdmin={isAdmin} space={space} />
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
          <FieldLabel>Sync with Github Repo</FieldLabel>
          <ConnectGithubApp spaceId={space.id} spaceDomain={space.domain} />
        </Grid>
        {kycCredentials && (
          <Grid item>
            <FieldLabel>KYC</FieldLabel>
            <Typography variant='body2' mb={2}>
              Choose your provider
            </Typography>
            <SpaceKyc control={control} isAdmin={isAdmin} />
          </Grid>
        )}
        {isAdmin && space.kycOption === 'synaps' && kycCredentials?.synaps?.apiKey && (
          <Grid item>
            <SynapsModal spaceId={space.id} />
          </Grid>
        )}
        {isAdmin &&
          space.kycOption === 'persona' &&
          kycCredentials?.persona?.apiKey &&
          kycCredentials.persona.envId &&
          kycCredentials.persona.templateId && (
            <Grid item>
              <PersonaModal spaceId={space.id} />
            </Grid>
          )}
        {isAdmin && kycCredentials && (
          <Grid item>
            <Box display='flex' justifyContent='space-between'>
              <Typography variant='body2'>Save your settings and test your KYC flow</Typography>
              <Box>
                {isDirty && (
                  <Button
                    disableElevation
                    variant='outlined'
                    disabled={isLoading || !isDirty}
                    onClick={resetValues}
                    sx={{ mr: 2 }}
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  disableElevation
                  disabled={isLoading || !isDirty}
                  type='submit'
                  loading={isLoading}
                  data-test='save-kyc-form'
                >
                  Save
                </Button>
              </Box>
            </Box>
          </Grid>
        )}
      </Grid>
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
    kycOption: space.kycOption
  };
}
