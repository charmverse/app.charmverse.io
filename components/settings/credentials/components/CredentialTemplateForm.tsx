import type { CredentialTemplate } from '@charmverse/core/dist/cjs/prisma-client';
import { yupResolver } from '@hookform/resolvers/yup';
import { FormLabel, InputLabel } from '@mui/material';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useState, type ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import { Button } from 'components/common/Button';
import { Dialog } from 'components/common/Dialog/Dialog';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';

import type { ProposalCredentialToPreview } from './ProposalCredentialPreview';
import { ProposalCredentialPreview } from './ProposalCredentialPreview';

const schema = yup.object({
  name: yup.string().required(),
  organization: yup.string().required(),
  description: yup.string()
});

type FormValues = yup.InferType<typeof schema>;

function CredentialTemplateForm({ credentialTemplate }: { credentialTemplate?: CredentialTemplate }) {
  const { user } = useUser();
  const { space } = useCurrentSpace();
  const [isAttesting, setIsAttesting] = useState(false);
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
      organization: credentialTemplate?.name ?? space?.name,
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

  function handleSave(formValues: FormValues) {
    console.log('FORM', formValues);
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
            <Button loading={isAttesting} size='large' type='submit' disabled={Object.keys(errors).length !== 0}>
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
  credentialTemplate
}: {
  isOpen: boolean;
  onClose: () => void;
  credentialTemplate?: CredentialTemplate;
}) {
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      title={!credentialTemplate ? 'Create a Credential' : 'Update an existing credential'}
    >
      <CredentialTemplateForm credentialTemplate={credentialTemplate} />
    </Dialog>
  );
}
