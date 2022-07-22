import { yupResolver } from '@hookform/resolvers/yup';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import TextField from '@mui/material/TextField';
import { Application, Bounty } from '@prisma/client';
import charmClient from 'charmClient';
import InlineCharmEditor from 'components/common/CharmEditor/InlineCharmEditor';
import { useUser } from 'hooks/useUser';
import { isValidChainAddress } from 'lib/tokens/validation';
import { SystemError } from 'lib/utilities/errors';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

const schema = yup.object({
  submission: yup.string().required(),
  submissionNodes: yup.mixed().required(),
  walletAddress: yup.string().required('Please provide a valid wallet address.')
    .test('verifyContractFormat', 'Invalid wallet address', (value) => {
      return !value || isValidChainAddress(value);
    })
});

type FormValues = yup.InferType<typeof schema>

interface Props {
  submission?: Application,
  bounty: Bounty,
  onSubmit: (submission: Application) => void
  onCancel?: () => void
}

export default function BountySubmissionForm ({ onCancel, submission, onSubmit: onSubmitProp, bounty }: Props) {
  const [user] = useUser();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, touchedFields, isValid, isValidating, isSubmitting }
  } = useForm<FormValues>({
    mode: 'onChange',
    defaultValues: {
      submission: submission?.submission as string,
      submissionNodes: submission?.submissionNodes as any as JSON,
      walletAddress: (submission?.walletAddress ?? user?.addresses?.[0]) as any
    },
    resolver: yupResolver(schema)
  });

  const [formError, setFormError] = useState<SystemError | null>(null);

  //  const defaultWalletAddress = submission.walletAddress ?? ;

  async function onSubmit (values: FormValues) {
    setFormError(null);
    let application: Application;
    try {
      if (submission) {
        // Update
        application = await charmClient.updateSubmission({
          submissionId: submission.id,
          content: values
        });
      }
      else {
        // create
        application = await charmClient.createSubmission({
          bountyId: bounty.id,
          submissionContent: values
        });
      }
      onSubmitProp(application);
    }
    catch (err: any) {
      setFormError(err);
    }
  }

  //  console.log('Submission', submission.submissionNodes, typeof submission.submissionNodes);

  return (
    <Box>
      <form onSubmit={handleSubmit(onSubmit)} style={{ margin: 'auto' }}>
        <Grid container direction='column' spacing={3}>
          <Grid item>
            <InlineCharmEditor
              content={submission?.submissionNodes ? JSON.parse(submission?.submissionNodes) : null}
              onContentChange={content => {
                setValue('submission', content.rawText, {
                  shouldValidate: true
                });
                setValue('submissionNodes', content.doc, {
                  shouldValidate: true
                });
              }}
              placeholderText='Enter the content of your submission here.'
            />

          </Grid>

          <Grid item>
            <InputLabel>
              Address to get paid for this bounty
            </InputLabel>
            <TextField
              {...register('walletAddress')}
              type='text'
              fullWidth
              error={!!errors.walletAddress}
              helperText={errors.walletAddress?.message}
            />

          </Grid>

          {
            formError && (
              <Grid item>
                <Alert severity={formError.severity}>
                  {formError.message}
                </Alert>
              </Grid>
            )
          }

          <Grid item display='flex' gap={1}>
            <Button disabled={!isValid} type='submit'>Save</Button>
            {onCancel && <Button onClick={onCancel} color='error'>Cancel</Button>}
          </Grid>

        </Grid>

      </form>
    </Box>
  );
}
