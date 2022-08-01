import { yupResolver } from '@hookform/resolvers/yup';
import { FormLabel, lighten, Stack, Typography } from '@mui/material';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import TextField from '@mui/material/TextField';
import { Application } from '@prisma/client';
import charmClient from 'charmClient';
import InlineCharmEditor from 'components/common/CharmEditor/InlineCharmEditor';
import Link from 'components/common/Link';
import { useUser } from 'hooks/useUser';
import { isValidChainAddress } from 'lib/tokens/validation';
import { SystemError } from 'lib/utilities/errors';
import { shortenHex } from 'lib/utilities/strings';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { AssignedBountyPermissions } from 'lib/bounties';

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
  bountyId: string,
  onSubmit?: (submission: Application) => void
  showHeader?: boolean
  readOnly?: boolean
  permissions: AssignedBountyPermissions
}

export default function BountySubmissionForm (
  { permissions, readOnly = false, showHeader = false, submission, onSubmit: onSubmitProp, bountyId }: Props
) {
  const [user] = useUser();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isValid }
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
          bountyId,
          submissionContent: values
        });
      }
      if (onSubmitProp) {
        onSubmitProp(application);
      }
    }
    catch (err: any) {
      setFormError(err);
    }
  }

  return (
    <Stack my={2} gap={1}>
      {readOnly && submission?.walletAddress && (
        <Typography sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}
        >
          Payment address:
          <Link
            sx={{
              display: 'flex',
              alignItems: 'center'
            }}
            external
            target='_blank'
            href={`https://etherscan.io/address/${submission.walletAddress}`}
          >{shortenHex(submission.walletAddress)}
            <OpenInNewIcon fontSize='small' />
          </Link>
        </Typography>
      )}
      {
        showHeader && (
        <FormLabel sx={{
          fontWeight: 'bold'
        }}
        >Submission
        </FormLabel>
        )
      }
      <form onSubmit={handleSubmit(onSubmit)} style={{ margin: 'auto', width: '100%' }}>
        <Grid container direction='column' spacing={2}>

          <Grid
            item
          >
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
              style={{
                backgroundColor: 'var(--input-bg)',
                border: '1px solid var(--input-border)',
                borderRadius: 3,
                minHeight: 130
              }}
              readOnly={readOnly}
              placeholderText={permissions.userPermissions.review ? 'No submission yet' : 'Enter the content of your submission here.'}
            />

          </Grid>

          {!readOnly && (
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
              disabled={readOnly}
            />

          </Grid>
          )}

          {
            formError && (
              <Grid item>
                <Alert severity={formError.severity}>
                  {formError.message}
                </Alert>
              </Grid>
            )
          }

          {!readOnly && (
          <Grid item display='flex' gap={1}>
            <Button disabled={!isValid} type='submit'>Submit</Button>
          </Grid>
          )}

        </Grid>

      </form>
    </Stack>
  );
}
