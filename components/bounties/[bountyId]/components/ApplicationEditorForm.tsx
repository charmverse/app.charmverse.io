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
import { MINIMUM_APPLICATION_MESSAGE_CHARACTERS } from 'lib/applications/shared';
import { FormMode } from '../../components/BountyEditorForm';

interface IApplicationFormProps {
  onSubmit: (application: Application) => any,
  bountyId: string
  mode?: FormMode
  proposal?: Application
}

export const schema = yup.object({
  message: yup.string().required('Please enter a proposal.').min(MINIMUM_APPLICATION_MESSAGE_CHARACTERS, `Application proposal must contain at least ${MINIMUM_APPLICATION_MESSAGE_CHARACTERS} characters.`)
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
    defaultValues: {
      message: proposal?.message as string
    },
    resolver: yupResolver(schema)
  });

  const [user] = useUser();

  const applicationExample = 'Explain why you are the right person or team to work on this bounty.';

  async function submitted (proposalToSave: Application) {
    if (mode === 'create') {
      proposalToSave.bountyId = bountyId;
      proposalToSave.status = 'applied';
      const createdApplication = await charmClient.createApplication(proposalToSave);
      onSubmit(createdApplication);
      refreshBounty(bountyId);
    }
    else if (mode === 'update') {
      await charmClient.updateApplication(proposal?.id as string, proposalToSave);
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

