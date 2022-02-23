import { yupResolver } from '@hookform/resolvers/yup';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Input from '@mui/material/Input';
import InputLabel from '@mui/material/InputLabel';
import TextField from '@mui/material/TextField';
import { Proposal } from '@prisma/client';
import charmClient from 'charmClient';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useUser } from 'hooks/useUser';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { FormMode } from './BountyEditorForm';

interface IProposalFormProps {
  onSubmit: (bounty: Proposal) => any,
  bountyId: string
  mode?: FormMode
  proposal?: Proposal
}

export const schema = yup.object({
  walletAddress: yup.string().required('Please provide a valid wallet address.'),
  message: yup.string().required('Please enter a proposal.')
});

type FormValues = yup.InferType<typeof schema>

export function ProposalEditorForm ({ onSubmit, bountyId, proposal, mode = 'create' }: IProposalFormProps) {

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

  async function submitted (proposalToSave: Proposal) {
    if (mode === 'create') {
      proposalToSave.applicantId = user!.id;
      proposalToSave.bountyId = bountyId;
      const createdProposal = await charmClient.createProposal(proposalToSave);
      onSubmit(createdProposal);
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit(formValue => submitted(formValue as Proposal))} style={{ margin: 'auto', maxHeight: '80vh', overflowY: 'auto' }}>
        <Grid container direction='column' spacing={3}>

          <Grid item>
            <InputLabel>
              Your proposal
            </InputLabel>
            <TextField
              {...register('message')}
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
              Your wallet address
            </InputLabel>
            <Input
              {...register('walletAddress')}
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

