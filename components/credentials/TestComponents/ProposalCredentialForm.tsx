import type { CredentialTemplate } from '@charmverse/core/dist/cjs/prisma-client';
import { yupResolver } from '@hookform/resolvers/yup';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useState, type ChangeEvent, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import charmClient from 'charmClient';
import { Button } from 'components/common/Button';
import { useGetCredentialTemplates } from 'components/settings/credentials/hooks/credentialHooks';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import { useWeb3Account } from 'hooks/useWeb3Account';
import type { SignedCredential } from 'lib/credentials/attest';
import type { PublishedSignedCredential } from 'lib/credentials/queriesAndMutations';
import type { ProposalCredential } from 'lib/credentials/schemas';
import { getAppApexDomain } from 'lib/utilities/domains/getAppApexDomain';

import { CredentialSelect } from '../CredentialsSelect';

import { ProposalCredentialCard } from './ProposalCredentialCard';

const schema = yup.object({
  name: yup.string().required(),
  description: yup.string().required(),
  organization: yup.string().required(),
  status: yup.string().required(),
  url: yup.string().required(),
  recipient: yup.string().required()
});

type FormValues = yup.InferType<typeof schema>;

export function ProposalCredentialForm() {
  const { user } = useUser();
  const { space } = useCurrentSpace();
  const [isAttesting, setIsAttesting] = useState(false);
  const { account } = useWeb3Account();
  const { showMessage } = useSnackbar();

  const { data: credentialTemplates } = useGetCredentialTemplates({ spaceId: space?.id });

  const [selectedCredentialTemplate, setSelectedCredentialTemplate] = useState<string | null>(null);

  const [signedAttestation, setSignedAttestation] = useState<PublishedSignedCredential | null>(null);

  async function attest(values: FormValues) {
    setIsAttesting(true);
    setSignedAttestation(null);

    try {
      const attestResponse = await charmClient.credentials.attest({
        chainId: 10,
        credential: {
          type: 'proposal',
          data: values as ProposalCredential
        },
        recipient: values.recipient as string
      });

      setSignedAttestation(attestResponse);

      showMessage('Attestation success!', 'success');
    } catch (err: any) {
      showMessage(err?.message);
    } finally {
      setIsAttesting(false);
    }
  }

  const {
    register,
    setValue,
    trigger,
    getValues,
    handleSubmit,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues: {
      organization: space?.name,
      name: 'RFG7: Tooling for 6551',
      description: 'Request for Grants 7: Tooling for 6551',
      status: 'applied',
      url: `${getAppApexDomain()}/${space?.domain}/proposals`,
      recipient: '0x4A29c8fF7D6669618580A68dc691565B07b19e25'
    },
    // mode: 'onChange',
    resolver: yupResolver(schema)
  });

  const template = selectedCredentialTemplate
    ? credentialTemplates?.find((t) => t.id === selectedCredentialTemplate)
    : undefined;

  useEffect(() => {
    if (template) {
      setValue('name', template.name);
      setValue('description', template.description ?? '');
      setValue('organization', template.organization);
    }
  }, [selectedCredentialTemplate]);

  const onChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setValue(event.target.name as keyof FormValues, value);
    return trigger();
  };

  return (
    <div>
      <CredentialSelect
        onChange={setSelectedCredentialTemplate}
        selectedCredentialId={selectedCredentialTemplate as string}
      />

      {selectedCredentialTemplate && (
        <form onSubmit={handleSubmit(attest)}>
          <Stack gap={2}>
            <Typography>Create a credential</Typography>

            <TextField
              {...register('recipient')}
              autoFocus
              error={!!errors.name}
              helperText={errors.name?.message}
              onChange={onChange}
            />
            <TextField
              {...register('name', { disabled: true })}
              autoFocus
              error={!!errors.name}
              helperText={errors.name?.message}
              onChange={onChange}
            />
            <TextField
              {...register('description', { disabled: true })}
              autoFocus
              error={!!errors.description}
              helperText={errors.description?.message}
              onChange={onChange}
            />
            <TextField
              {...register('organization', { disabled: true })}
              autoFocus
              error={!!errors.name}
              helperText={errors.name?.message}
              onChange={onChange}
            />
            <TextField
              {...register('url', { disabled: true })}
              autoFocus
              error={!!errors.name}
              helperText={errors.name?.message}
              onChange={onChange}
            />
            <TextField
              {...register('status', { disabled: true })}
              autoFocus
              error={!!errors.name}
              helperText={errors.name?.message}
              placeholder='me@gmail.com'
              onChange={onChange}
            />
            <Stack flexDirection='row' gap={1} justifyContent='flex-start'>
              <Button loading={isAttesting} size='large' type='submit' disabled={Object.keys(errors).length !== 0}>
                Attest
              </Button>
            </Stack>
          </Stack>
        </form>
      )}
      <Divider />
      {signedAttestation && (
        <Box sx={{ maxWidth: '400px' }}>
          <ProposalCredentialCard credential={signedAttestation} />
        </Box>
      )}
    </div>
  );
}
