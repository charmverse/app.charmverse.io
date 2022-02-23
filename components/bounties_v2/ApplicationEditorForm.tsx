import { yupResolver } from '@hookform/resolvers/yup';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Input from '@mui/material/Input';
import InputLabel from '@mui/material/InputLabel';
import TextField from '@mui/material/TextField';
import { Application } from '@prisma/client';
import charmClient from 'charmClient';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useUser } from 'hooks/useUser';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { FormMode } from './BountyEditorForm';

interface IApplicationFormProps {
  onSubmit: (bounty: Application) => any,
  bountyId: string
  mode?: FormMode
  proposal?: Application
}

export const schema = yup.object({
  walletAddress: yup.string().required('Please provide a valid wallet address.'),
  message: yup.string().required('Please enter a proposal.')
});

type FormValues = yup.InferType<typeof schema>

export function ApplicationEditorForm ({ onSubmit, bountyId, proposal, mode = 'create' }: IApplicationFormProps) {

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors, touchedFields, isValid, isValidating, isSubmitting }
  } = useForm<FormValues>({
    mode: 'onBlur',
    defaultValues: proposal as any,
    resolver: yupResolver(schema)
  });

  const [space] = useCurrentSpace();
  const [user] = useUser();

  const applicationExample = 'Explain why you are the right person or team to resolve this bounty';

  const walletAddress = user?.addresses[0];

  async function submitted (proposalToSave: Application) {
    if (mode === 'create') {
      proposalToSave.applicantId = user!.id;
      proposalToSave.bountyId = bountyId;
      const createdApplication = await charmClient.createApplication(proposalToSave);
      onSubmit(createdApplication);
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit(formValue => submitted(formValue as Application))} style={{ margin: 'auto', maxHeight: '80vh', overflowY: 'auto' }}>
        <Grid container direction='column' spacing={3}>

          <Grid item>
            <InputLabel>
              Your proposal
            </InputLabel>
            <TextField
              {...register('message')}
              placeholder={applicationExample}
              multiline
              type='text'
              fullWidth
            />
            {
              errors?.message && (
              <Alert severity='error'>
                {errors.message.message}
              </Alert>
              )
            }

          </Grid>

          <Grid item>
            <InputLabel>
              Address to get paid for this bounty
            </InputLabel>
            <Input
              {...register('walletAddress')}
              defaultValue={walletAddress}
              type='text'
              fullWidth
            />

            {
              errors?.walletAddress && (
              <Alert severity='error'>
                {errors.walletAddress.message}
              </Alert>
              )
            }
          </Grid>

          <Grid item>
            <Button disabled={!isValid} type='submit'>Submit application</Button>
          </Grid>

        </Grid>

      </form>
    </div>
  );
}

