import type { AttestationType, CredentialEventType, CredentialTemplate } from '@charmverse/core/prisma-client';
import { yupResolver } from '@hookform/resolvers/yup';
import { InputLabel } from '@mui/material';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { attestationSchemaIds } from '@packages/credentials/schemas';
import { useState, type ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { optimism } from 'viem/chains';
import * as yup from 'yup';

import charmClient from 'charmClient';
import { Button } from 'components/common/Button';
import { Dialog } from 'components/common/Dialog/Dialog';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';

import { CredentialEventsSelector } from './CredentialEventsForm';
import type { ProposalCredentialToPreview } from './ProposalCredentialPreview';
import { ProposalCredentialPreview } from './ProposalCredentialPreview';

const schema = yup.object({
  name: yup.string().required(),
  organization: yup.string().required(),
  description: yup.string(),
  credentialEvents: yup.array()
});

type FormValues = yup.InferType<typeof schema>;

type Props = {
  credentialTemplate?: CredentialTemplate | null;
  refreshTemplates: VoidFunction;
  newCredentialTemplateType?: AttestationType | null;
  onClose: () => void;
};

const defaultEventValues: Record<AttestationType, CredentialEventType[]> = {
  proposal: ['proposal_approved'],
  reward: ['reward_submission_approved'],
  external: ['proposal_approved']
};

function CredentialTemplateForm({ credentialTemplate, refreshTemplates, newCredentialTemplateType, onClose }: Props) {
  const { space } = useCurrentSpace();
  const [isSaving, setIsSaving] = useState(false);
  const { showMessage } = useSnackbar();

  const templateType = credentialTemplate?.schemaType ?? (newCredentialTemplateType as AttestationType);

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
      name: credentialTemplate?.name,
      description: credentialTemplate?.description,
      credentialEvents: credentialTemplate?.credentialEvents ?? defaultEventValues[templateType]
    },
    // mode: 'onChange',
    resolver: yupResolver(schema)
  });

  const selectedCredentialEvents = watch('credentialEvents');

  const onChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setValue(event.target.name as keyof FormValues, value);
    return trigger();
  };

  async function handleSave(formValues: FormValues) {
    setIsSaving(true);
    try {
      if (!credentialTemplate) {
        const schemaId = attestationSchemaIds[templateType];
        await charmClient.credentials.createCredentialTemplate({
          ...formValues,
          description: formValues.description ?? '',
          schemaType: newCredentialTemplateType as AttestationType,
          spaceId: space?.id as string,
          schemaAddress: schemaId,
          credentialEvents: formValues.credentialEvents as CredentialEventType[]
        });
      } else {
        await charmClient.credentials.updateCredentialTemplate({
          templateId: credentialTemplate?.id as string,
          fields: formValues
        });
      }
      refreshTemplates();
      onClose?.();
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
              placeholder='Season 5'
              error={!!errors.name}
              helperText={errors.name?.message}
              onChange={onChange}
            />
          </Box>
          <Box>
            <InputLabel>Description</InputLabel>
            <TextField
              {...register('description')}
              placeholder='Participated in RPGF Season 5'
              fullWidth
              error={!!errors.description}
              helperText={errors.description?.message}
              onChange={onChange}
            />
          </Box>
          <Divider />
          {/* <Box>
            <CredentialEventsSelector
              selectedCredentialEvents={selectedCredentialEvents as CredentialEventType[]}
              onChange={(events) => setValue('credentialEvents', events)}
              credentialTemplateType={templateType}
            />
          </Box> */}
          <ProposalCredentialPreview
            credentialTemplateType={templateType}
            credential={getValues() as ProposalCredentialToPreview}
          />
          <Stack flexDirection='row' gap={1} justifyContent='flex-end'>
            <Button loading={isSaving} size='large' type='submit' disabled={Object.keys(errors).length !== 0}>
              Save
            </Button>
          </Stack>
        </Stack>
      </form>
    </Box>
  );
}
export function CredentialTemplateDialog({
  isOpen,
  ...props
}: Props & {
  isOpen: boolean;
}) {
  return (
    <Dialog
      open={isOpen}
      onClose={props.onClose}
      title={!props.credentialTemplate ? 'Create a Credential' : 'Update an existing credential'}
    >
      <CredentialTemplateForm {...props} />
    </Dialog>
  );
}
