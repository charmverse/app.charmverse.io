import { yupResolver } from '@hookform/resolvers/yup';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import FieldLabel from 'components/common/form/FieldLabel';
import TextField from '@mui/material/TextField';
import { Application } from '@prisma/client';
import charmClient from 'charmClient';
import { useUser } from 'hooks/useUser';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { isValidChainAddress } from 'lib/tokens/validation';
import { FormMode } from './BountyEditorForm';

interface IApplicationFormProps {
  onSubmit: (application: Application) => any,
  bountyId: string
  mode?: FormMode
  proposal?: Application
}

export const schema = yup.object({
  walletAddress: yup.string().required('Please provide a valid wallet address.')
    .test('verifyContractFormat', 'Invalid wallet address', (value) => {
      return !value || isValidChainAddress(value);
    }),
  message: yup.string().required('Please enter a proposal.')
});

type FormValues = yup.InferType<typeof schema>

export function ApplicationEditorForm ({ onSubmit, bountyId, proposal, mode = 'create' }: IApplicationFormProps) {

  const {
    register,
    handleSubmit,
    formState: { errors, touchedFields, isValid, isValidating, isSubmitting }
  } = useForm<FormValues>({
    mode: 'onChange',
    defaultValues: proposal as any,
    resolver: yupResolver(schema)
  });

  const [user] = useUser();

  const applicationExample = 'Explain why you are the right person or team to resolve this bounty';

  const walletAddress = user?.addresses[0];

  async function submitted (proposalToSave: Application) {
    if (mode === 'create') {
      proposalToSave.createdBy = user!.id;
      proposalToSave.bountyId = bountyId;
      const createdApplication = await charmClient.createApplication(proposalToSave);
      onSubmit(createdApplication);
    }
    else if (mode === 'update') {
      await charmClient.updateApplication(proposalToSave);
      onSubmit(proposalToSave);
    }

  }

  return (
    <div>
      <form onSubmit={handleSubmit(formValue => submitted(formValue as Application))} style={{ margin: 'auto', maxHeight: '80vh', overflowY: 'auto' }}>
        <Grid container direction='column' spacing={3}>
          <Grid item>
            <FieldLabel>
              Your proposal
            </FieldLabel>
            <TextField
              {...register('message')}
              autoFocus
              placeholder={applicationExample}
              minRows={5}
              multiline
              variant='outlined'
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
            <FieldLabel>
              Address to get paid for this bounty
            </FieldLabel>
            <TextField
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
            <Button disabled={!isValid} type='submit'>{mode === 'create' ? ' Submit application' : 'Update application'}</Button>
          </Grid>

        </Grid>

      </form>
    </div>
  );
}

