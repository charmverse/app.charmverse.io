import type { Space, KycOption } from '@charmverse/core/prisma-client';
import { yupResolver } from '@hookform/resolvers/yup';
import { Box, Stack, Grid } from '@mui/material';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import { useGetKycCredentials, useUpdateSpace, useUpdateKycCredentials } from 'charmClient/hooks/spaces';
import { Button } from 'components/common/Button';
import { useConfirmationModal } from 'hooks/useConfirmationModal';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import type { KycCredentials } from 'lib/kyc/getKycCredentials';

import { IntegrationContainer } from '../IntegrationContainer';

import { KYCSettingsForm } from './KYCSettingsForm';
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

export function KYCSettings({ space, isAdmin }: { space: Space; isAdmin: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const { refreshCurrentSpace } = useCurrentSpace();
  const { showConfirmation } = useConfirmationModal();
  const { data: kycCredentials, mutate: mutateKycCredentials } = useGetKycCredentials(space.id);
  const { trigger: updateKycCredential, isMutating: kycUpdateCredentialsLoading } = useUpdateKycCredentials(space.id);
  const { trigger: updateSpace, isMutating: updateSpaceLoading } = useUpdateSpace(space.id);
  const {
    handleSubmit,
    control,
    watch,
    reset,
    formState: { isDirty, dirtyFields, isValid }
  } = useForm<FormValues>({
    defaultValues: getDefaultValues({ kycCredentials, space }),
    resolver: yupResolver(schema),
    mode: 'onSubmit'
  });
  const kycOption = watch('kycOption');
  const isLoading = updateSpaceLoading || kycUpdateCredentialsLoading;
  const resetValues = () => reset(getDefaultValues({ kycCredentials, space }));

  function disconnectKYC() {
    if (!isAdmin) {
      return;
    }
    showConfirmation({
      message: 'Are you sure you want to disconnect KYC?',
      confirmButton: 'Disconnect',
      onConfirm: async () => {
        await updateSpace({ kycOption: null });
        // TODO: allow clearing out the kyc credentials
        // await updateKycCredential({ synaps: null, persona: null }, { onSuccess: (data) => mutateKycCredentials(data) });
        resetValues();
        refreshCurrentSpace();
      }
    });
  }

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

    await updateSpace({ kycOption: values.kycOption }, { onSuccess: () => refreshCurrentSpace() });

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
      title='KYC'
      subheader='Verify the identity of your members'
      expanded={expanded}
      setExpanded={setExpanded}
      isAdmin={isAdmin}
      isConnected={!!space.kycOption}
      onCancel={resetValues}
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack gap={2}>
          {kycCredentials && (
            <div>
              <KYCSettingsForm control={control} isAdmin={isAdmin} />
            </div>
          )}
          {isAdmin && space.kycOption === 'synaps' && kycCredentials?.synaps?.apiKey && (
            <div>
              <SynapsModal spaceId={space.id} />
            </div>
          )}
          {isAdmin &&
            space.kycOption === 'persona' &&
            kycCredentials?.persona?.apiKey &&
            kycCredentials.persona.templateId && (
              <div>
                <PersonaModal spaceId={space.id} />
              </div>
            )}
          {isAdmin && kycCredentials && (
            <Box display='flex' gap={2}>
              {/* {isDirty && (
                <Button
                  disableElevation
                  variant='outlined'
                  disabled={isLoading || !isDirty}
                  onClick={resetValues}
                  sx={{ mr: 2 }}
                >
                  Cancel
                </Button>
              )} */}
              <Button
                disabled={isLoading || !isDirty || !isValid || !kycOption}
                type='submit'
                loading={isLoading}
                data-test='save-kyc-form'
              >
                Save
              </Button>
              {space.kycOption && (
                <Button color='error' variant='outlined' onClick={disconnectKYC}>
                  Disconnect
                </Button>
              )}
            </Box>
          )}
        </Stack>
      </form>
    </IntegrationContainer>
  );
}

function getDefaultValues({ kycCredentials, space }: { kycCredentials?: KycCredentials; space: Space }) {
  return {
    synapsApiKey: (space.kycOption && kycCredentials?.synaps?.apiKey) ?? '',
    synapsSecret: (space.kycOption && kycCredentials?.synaps?.secret) ?? '',
    personaApiKey: (space.kycOption && kycCredentials?.persona?.apiKey) ?? '',
    personaSecret: (space.kycOption && kycCredentials?.persona?.secret) ?? '',
    personaTemplateId: (space.kycOption && kycCredentials?.persona?.templateId) ?? '',
    kycOption: space.kycOption ?? null
  };
}
