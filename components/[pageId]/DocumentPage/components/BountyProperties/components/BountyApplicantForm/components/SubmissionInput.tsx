import { yupResolver } from '@hookform/resolvers/yup';
import { FormLabel } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Collapse from '@mui/material/Collapse';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import TextField from '@mui/material/TextField';
import { Application } from '@prisma/client';
import charmClient from 'charmClient';
import InlineCharmEditor from 'components/common/CharmEditor/InlineCharmEditor';
import { useUser } from 'hooks/useUser';
import { isValidChainAddress } from 'lib/tokens/validation';
import { SystemError } from 'lib/utilities/errors';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { AssignedBountyPermissions } from 'lib/bounties';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import BountyApplicantStatus from '../../BountyApplicantStatus';

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
  submission?: Application;
  bountyId: string;
  onSubmit?: (submission: Application) => void;
  onCancel?: () => void;
  readOnly?: boolean;
  permissions: AssignedBountyPermissions;
  expandedOnLoad?: boolean;
  alwaysExpanded?: boolean;
}

export default function SubmissionInput (
  { permissions, readOnly = false, submission, onSubmit: onSubmitProp, bountyId, alwaysExpanded, expandedOnLoad, onCancel = () => null }: Props
) {
  const [user] = useUser();
  const [isVisible, setIsVisible] = useState(expandedOnLoad ?? alwaysExpanded ?? false);

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
      setIsVisible(false);
    }
    catch (err: any) {
      setFormError(err);
    }
  }

  return (
    <Stack my={2} gap={1}>
      <Stack
        flexDirection='row'
        gap={0.5}
        onClick={() => {
          if (!alwaysExpanded) {
            setIsVisible(!isVisible);
          }
        }}
      >
        <>
          <FormLabel sx={{
            fontWeight: 'bold'
          }}
          >
            {submission?.createdBy === user?.id ? 'Your submission' : 'Submission'}
            {
          submission && submission.status !== 'applied' && submission.createdBy === user?.id && (
            <BountyApplicantStatus submission={submission} />
          )
        }
          </FormLabel>
          {!alwaysExpanded && (
            <IconButton
              sx={{
                top: -2.5,
                position: 'relative'
              }}
              size='small'
            >
              {isVisible ? <KeyboardArrowUpIcon fontSize='small' /> : <KeyboardArrowDownIcon fontSize='small' />}
            </IconButton>
          )}
        </>
      </Stack>
      <Collapse in={isVisible} timeout='auto' unmountOnExit>
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
                readOnly={readOnly || submission?.status === 'complete' || submission?.status === 'paid'}
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
                <Button disabled={!isValid} type='submit'>
                  {
                    submission?.submission ? 'Update' : 'Submit'
                  }
                </Button>
                {!submission?.submission && (
                  <Button
                    onClick={() => {
                      setIsVisible(false);
                      onCancel();
                    }}
                    variant='outlined'
                    color='secondary'
                  >Cancel
                  </Button>
                )}
              </Grid>
            )}
          </Grid>
        </form>

      </Collapse>
    </Stack>
  );
}
