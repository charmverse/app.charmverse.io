import type { Space, KycOption } from '@charmverse/core/prisma-client';
import { yupResolver } from '@hookform/resolvers/yup';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import { useGetKycCredentials, useUpdateKycCredentials } from 'charmClient/hooks/kyc';
import { useUpdateSpace } from 'charmClient/hooks/spaces';
import { Button } from 'components/common/Button';
import { useConfirmationModal } from 'hooks/useConfirmationModal';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import type { KycCredentials } from '@packages/lib/kyc/getKycCredentials';

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
      then: () =>
        yup
          .string()
          .required('Field is required')
          .test('personaApiKey', 'Invalid api key', (value) => value.startsWith('persona_')),
      otherwise: () => yup.string()
    }),
  personaSecret: yup
    .string()
    .nullable()
    .test('personaSecret', 'Invalid secret', (value) => (value ? value?.startsWith('wbhsec_') : true)),
  personaTemplateId: yup
    .string()
    .nullable()
    .when('kycOption', {
      is: (val: KycOption | null) => val === 'persona',
      then: () =>
        yup
          .string()
          .required('Field is required')
          .test('templateId', 'Invalid template id', (value) => value.startsWith('itmpl_')),
      otherwise: () => yup.string()
    }),
  kycOption: yup.string().oneOf<KycOption | ''>(['synaps', 'persona', '']).nullable()
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
    formState: { isDirty, dirtyFields, isValid, errors }
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

    if (values.kycOption) {
      await updateSpace({ kycOption: values.kycOption }, { onSuccess: () => refreshCurrentSpace() });
    }

    if (
      dirtyFields.synapsApiKey ||
      dirtyFields.synapsSecret ||
      dirtyFields.personaApiKey ||
      dirtyFields.personaSecret ||
      dirtyFields.personaTemplateId
    ) {
      const payload: KycCredentials = {
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

      await updateKycCredential({ ...payload }, { onSuccess: (data) => mutateKycCredentials(data) });
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
              <SynapsModal spaceId={space.id} isAdmin={isAdmin} />
            </div>
          )}
          {isAdmin &&
            space.kycOption === 'persona' &&
            kycCredentials?.persona?.apiKey &&
            kycCredentials.persona.templateId && (
              <div>
                <PersonaModal spaceId={space.id} isAdmin={isAdmin} />
              </div>
            )}
          {isAdmin && kycCredentials && (
            <Box display='flex' gap={2}>
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
