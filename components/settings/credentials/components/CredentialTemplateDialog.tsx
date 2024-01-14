import type { CredentialTemplate } from '@charmverse/core/dist/cjs/prisma-client';
import { yupResolver } from '@hookform/resolvers/yup';
import { InputLabel } from '@mui/material';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useState, type ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { optimism } from 'viem/chains';
import * as yup from 'yup';

import charmClient from 'charmClient';
import { Button } from 'components/common/Button';
import { Dialog } from 'components/common/Dialog/Dialog';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';
import { getAttestationSchemaId } from 'lib/credentials/schemas';

import type { ProposalCredentialToPreview } from './ProposalCredentialPreview';
import { ProposalCredentialPreview } from './ProposalCredentialPreview';

const schema = yup.object({
  name: yup.string().required(),
  organization: yup.string().required(),
  description: yup.string()
});

type FormValues = yup.InferType<typeof schema>;

function CredentialTemplateForm({
  credentialTemplate,
  refreshTemplates,
  close
}: {
  credentialTemplate?: CredentialTemplate | null;
  refreshTemplates: VoidFunction;
  close: () => void;
}) {
  const { space } = useCurrentSpace();
  const [isSaving, setIsSaving] = useState(false);
  const { showMessage } = useSnackbar();

  const {
    register,
    setValue,
    trigger,
    getValues,
    handleSubmit,
    watch,
    formState: { errors, isValid }
  } = useForm<FormValues>({
    defaultValues: {
      organization: credentialTemplate?.organization ?? space?.name,
      name: credentialTemplate?.name ?? 'Season 5',
      description: credentialTemplate?.description ?? 'Participated in season 5 of our RFG scheme'
    },
    // mode: 'onChange',
    resolver: yupResolver(schema)
  });

  const onChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setValue(event.target.name as keyof FormValues, value);
    return trigger();
  };

  async function handleSave(formValues: FormValues) {
    setIsSaving(true);
    try {
      if (!credentialTemplate) {
        const schemaId = getAttestationSchemaId({ chainId: optimism.id, credentialType: 'proposal' });
        await charmClient.credentials.createCredentialTemplate({
          ...formValues,
          description: formValues.description ?? '',
          schemaType: 'proposal',
          spaceId: space?.id as string,
          schemaAddress: schemaId
        });
      } else {
        await charmClient.credentials.updateCredentialTemplate({
          templateId: credentialTemplate?.id as string,
          fields: formValues
        });
      }
      refreshTemplates();
      close?.();
    } catch (err: any) {
      showMessage(err.message ?? 'Error saving credential template');
    }
    setIsSaving(false);
  }

  return (
    <Box sx={{ width: '100%' }}>
      <form onSubmit={handleSubmit(handleSave)}>
        <Stack gap={2} display='flex'>
          <Box>
            <InputLabel>Organization</InputLabel>
            <TextField
              {...register('organization')}
              fullWidth
              autoFocus
              error={!!errors.organization}
              helperText={errors.organization?.message}
              onChange={onChange}
            />
          </Box>
          <Box>
            <InputLabel>Name</InputLabel>
            <TextField
              {...register('name')}
              fullWidth
              autoFocus
              error={!!errors.name}
              helperText={errors.name?.message}
              onChange={onChange}
            />
          </Box>
          <Box>
            <InputLabel>Description</InputLabel>
            <TextField
              {...register('description')}
              fullWidth
              autoFocus
              error={!!errors.description}
              helperText={errors.description?.message}
              onChange={onChange}
            />
          </Box>
          {isValid && <ProposalCredentialPreview credential={getValues() as ProposalCredentialToPreview} />}
          <Stack flexDirection='row' gap={1} justifyContent='flex-start'>
            <Button loading={isSaving} size='large' type='submit' disabled={Object.keys(errors).length !== 0}>
              Save
            </Button>
          </Stack>
        </Stack>
      </form>
      <Divider />
    </Box>
  );
}
export function CredentialTemplateDialog({
  isOpen,
  onClose,
  credentialTemplate,
  refreshTemplates
}: {
  isOpen: boolean;
  onClose: () => void;
  credentialTemplate?: CredentialTemplate | null;
  refreshTemplates: VoidFunction;
}) {
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      title={!credentialTemplate ? 'Create a Credential' : 'Update an existing credential'}
    >
      <CredentialTemplateForm
        close={onClose}
        credentialTemplate={credentialTemplate}
        refreshTemplates={refreshTemplates}
      />
    </Dialog>
  );
}
