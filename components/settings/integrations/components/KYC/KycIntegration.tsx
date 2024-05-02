import type { Space, KycOption } from '@charmverse/core/prisma-client';
import { yupResolver } from '@hookform/resolvers/yup';
import { Typography, Grid } from '@mui/material';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import { useGetKycCredentials, useUpdateSpace, useUpdateKycCredentials } from 'charmClient/hooks/spaces';
import { Button } from 'components/common/Button';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import type { KycCredentials } from 'lib/kyc/getKycCredentials';

import { IntegrationContainer } from '../IntegrationContainer';

import { KycIntegrationFields } from './KycIntegrationFields';
import { PersonaModal } from './PersonaModal';
import { SynapsModal } from './SynapsModal';

const schema = yup.object({
  synapsApiKey: yup
    .string()
    .nullable()
    .when('kycOption', {
      is: (val: KycOption | null) => val === 'synaps',
      then: () => yup.string().required('Field is required'),
      otherwise: () => yup.string()
    }),
  synapsSecret: yup.string().nullable(),
  personaApiKey: yup
    .string()
    .nullable()
    .when('kycOption', {
      is: (val: KycOption | null) => val === 'persona',
      then: () => yup.string().required('Field is required'),
      otherwise: () => yup.string()
    }),
  personaSecret: yup.string().nullable(),
  personaTemplateId: yup
    .string()
    .nullable()
    .when('kycOption', {
      is: (val: KycOption | null) => val === 'persona',
      then: () => yup.string().required('Field is required'),
      otherwise: () => yup.string()
    }),
  kycOption: yup.string().oneOf<KycOption>(['synaps', 'persona']).nullable()
});
export type FormValues = yup.InferType<typeof schema>;

export function KycIntegration({ space, isAdmin }: { space: Space; isAdmin: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const { refreshCurrentSpace } = useCurrentSpace();
  const { data: kycCredentials, mutate: mutateKycCredentials } = useGetKycCredentials(space.id);
  const { trigger: updateKycCredential, isMutating: kycUpdateCredentialsLoading } = useUpdateKycCredentials(space.id);
  const { trigger: updateSpace, isMutating: updateSpaceLoading } = useUpdateSpace(space.id);
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
  const isLoading = updateSpaceLoading || kycUpdateCredentialsLoading;
  const resetValues = () => reset(getDefaultValues({ kycCredentials, space }));

  useEffect(() => {
    resetValues();
  }, [
    kycCredentials?.synaps?.apiKey,
    kycCredentials?.synaps?.secret,
    kycCredentials?.persona?.apiKey,
    kycCredentials?.persona?.secret,
    kycCredentials?.persona?.templateId,
    space.kycOption
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
      dirtyFields.personaTemplateId
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
          templateId: values.personaTemplateId ?? ''
        }
      };

      await updateKycCredential({ ...synapsPayload }, { onSuccess: (data) => mutateKycCredentials(data) });
    }
  };

  return (
    <IntegrationContainer
      isConnected={!!space.kycOption}
      expanded={expanded}
      setExpanded={setExpanded}
      title='KYC'
      subheader='Verify the identity of your members'
    >
      <Typography variant='body2' mb={2}>
        Choose your provider
      </Typography>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={3} direction='column'>
          {kycCredentials && (
            <Grid item>
              <KycIntegrationFields control={control} isAdmin={isAdmin} />
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
            kycCredentials.persona.templateId && (
              <Grid item>
                <PersonaModal spaceId={space.id} />
              </Grid>
            )}
          {isAdmin && kycCredentials && isDirty && (
            <Grid item alignSelf='end'>
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
            </Grid>
          )}
        </Grid>
      </form>
    </IntegrationContainer>
  );
}

function getDefaultValues({ kycCredentials, space }: { kycCredentials?: KycCredentials; space: Space }) {
  return {
    synapsApiKey: kycCredentials?.synaps?.apiKey ?? '',
    synapsSecret: kycCredentials?.synaps?.secret ?? '',
    personaApiKey: kycCredentials?.persona?.apiKey ?? '',
    personaSecret: kycCredentials?.persona?.secret ?? '',
    personaTemplateId: kycCredentials?.persona?.templateId ?? '',
    kycOption: space.kycOption ?? null
  };
}
