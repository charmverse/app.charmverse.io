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
import { useBounties } from 'hooks/useBounties';
import { FormMode } from '../../components/BountyEditorForm';

interface IApplicationFormProps {
  onSubmit: (application: Application) => any,
  bountyId: string
  mode?: FormMode
  proposal?: Application
}

export const schema = yup.object({
  message: yup.string().required('Please enter a proposal.')
});

type FormValues = yup.InferType<typeof schema>

export function ApplicationEditorForm ({ onSubmit, bountyId, proposal, mode = 'create' }: IApplicationFormProps) {

  const { refreshBounty } = useBounties();

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
      proposalToSave.bountyId = bountyId;
      proposalToSave.status = 'applied';
      const createdApplication = await charmClient.createApplication(proposalToSave);
      onSubmit(createdApplication);
      refreshBounty(bountyId);
    }
    else if (mode === 'update') {
      await charmClient.updateApplication(proposalToSave);
      onSubmit(proposalToSave);
      refreshBounty(bountyId);
    }

  }

  return (
    <div>
      <form onSubmit={handleSubmit(formValue => submitted(formValue as Application))} style={{ margin: 'auto' }}>
        <Grid container direction='column' spacing={3}>
          <Grid item>
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
            <Button disabled={!isValid} type='submit'>{mode === 'create' ? ' Submit application' : 'Update application'}</Button>
          </Grid>

        </Grid>

      </form>
    </div>
  );
}

