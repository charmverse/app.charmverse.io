import type { Application } from '@charmverse/core/prisma';
import { yupResolver } from '@hookform/resolvers/yup';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { Box, Collapse, FormLabel, IconButton, Stack, Typography } from '@mui/material';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import charmClient from 'charmClient';
import Modal from 'components/common/Modal';
import { useBounties } from 'hooks/useBounties';
import { useLocalStorage } from 'hooks/useLocalStorage';
import { useUser } from 'hooks/useUser';
import type { ReviewDecision, SubmissionReview } from 'lib/applications/interfaces';
import { MINIMUM_APPLICATION_MESSAGE_CHARACTERS } from 'lib/applications/shared';
import type { AssignedBountyPermissions } from 'lib/bounties';

import BountyApplicantStatus from '../../BountyApplicantStatus';

/**
 * @expandedOnLoad Use this to expand the application initially
 */
interface IApplicationFormProps {
  onSubmit?: (application: Application) => any;
  bountyId: string;
  mode?: 'create' | 'update' | 'suggest';
  application?: Application;
  onCancel?: () => void;
  readOnly?: boolean;
  expandedOnLoad?: boolean;
  alwaysExpanded?: boolean;
  refreshSubmissions: VoidFunction;
  permissions: AssignedBountyPermissions;
}

export const schema = yup.object({
  message: yup
    .string()
    .required('Please enter a submission.')
    .min(
      MINIMUM_APPLICATION_MESSAGE_CHARACTERS,
      `Application submission must contain at least ${MINIMUM_APPLICATION_MESSAGE_CHARACTERS} characters.`
    )
});

type FormValues = yup.InferType<typeof schema>;

export default function ApplicationInput({
  permissions,
  readOnly = false,
  onCancel,
  onSubmit,
  bountyId,
  application,
  mode = 'create',
  alwaysExpanded,
  expandedOnLoad,
  refreshSubmissions
}: IApplicationFormProps) {
  const { refreshBounty } = useBounties();
  const [isVisible, setIsVisible] = useState(mode === 'create' || expandedOnLoad || alwaysExpanded);
  const { user } = useUser();

  const [applicationMessage, setApplicationMessage] = useLocalStorage(`${bountyId}.${user?.id}.application`, '');
  const [reviewDecision, setReviewDecision] = useState<SubmissionReview | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue
  } = useForm<FormValues>({
    mode: 'onChange',
    defaultValues: {
      // Default to saved message in local storage
      message: (application?.message as string) ?? applicationMessage
    },
    resolver: yupResolver(schema)
  });

  const applicationExample = 'Explain why you are the right person or team to work on this bounty.';

  async function submitted(proposalToSave: Application) {
    if (mode === 'create') {
      proposalToSave.bountyId = bountyId;
      proposalToSave.status = 'applied';
      const createdApplication = await charmClient.bounties.createApplication(proposalToSave);
      if (onSubmit) {
        onSubmit(createdApplication);
      }
      refreshBounty(bountyId);
      setApplicationMessage('');
    } else if (mode === 'update') {
      await charmClient.bounties.updateApplication(application?.id as string, proposalToSave);
      if (onSubmit) {
        onSubmit(proposalToSave);
      }
      refreshBounty(bountyId);
    }
  }

  function cancel() {
    setReviewDecision(null);
  }

  function makeSubmissionDecision(decision: ReviewDecision) {
    if (application?.id) {
      charmClient.bounties
        .reviewSubmission(application.id, decision)
        .then(() => {
          // Closes the modal
          setReviewDecision(null);
          refreshBounty(bountyId);
          refreshSubmissions();
        })
        .catch((err) => {});
    }
  }

  return (
    <Stack my={1} gap={1}>
      <Box
        display='flex'
        justifyContent='space-between'
        flexDirection='row'
        gap={0.5}
        sx={{ cursor: !alwaysExpanded ? 'pointer' : 'inherit' }}
        onClick={() => {
          if (!alwaysExpanded) {
            setIsVisible(!isVisible);
          }
        }}
      >
        <Box display='flex' gap={0.5}>
          <FormLabel sx={{ fontWeight: 'bold' }}>
            {application?.createdBy === user?.id ? 'Your application' : 'Application'}
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
        </Box>
        {application && application.status === 'applied' && application.createdBy === user?.id && (
          <BountyApplicantStatus submission={application} />
        )}
      </Box>
      <Collapse in={isVisible} timeout='auto' unmountOnExit>
        <form
          onSubmit={handleSubmit((formValue) => submitted(formValue as Application))}
          style={{ margin: 'auto', width: '100%' }}
        >
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
                disabled={readOnly}
                onChange={(ev) => {
                  // Only store in local storage if no application exists yet
                  const newText = ev.target.value;
                  if (!application) {
                    setApplicationMessage(newText);
                  }

                  setValue('message', newText, {
                    shouldValidate: true
                  });
                }}
              />
              {errors?.message && <Alert severity='error'>{errors.message.message}</Alert>}
            </Grid>

            {!readOnly && (
              <Grid item display='flex' gap={1}>
                <Button disabled={!isValid} type='submit'>
                  {mode === 'create' ? ' Submit' : 'Update'}
                </Button>
                <Button
                  onClick={() => {
                    onCancel?.();
                    setIsVisible(false);
                  }}
                  variant='outlined'
                  color='secondary'
                >
                  Cancel
                </Button>
              </Grid>
            )}

            {permissions.userPermissions.review && application?.id && application?.status === 'inProgress' && (
              <Grid item display='flex' gap={1}>
                <Button
                  color='error'
                  variant='outlined'
                  disabled={!readOnly}
                  onClick={() =>
                    setReviewDecision({
                      submissionId: application?.id,
                      decision: 'reject',
                      userId: user?.id as string
                    })
                  }
                >
                  Reject
                </Button>
              </Grid>
            )}
          </Grid>
        </form>
      </Collapse>
      <Modal title='Confirm your review' open={reviewDecision !== null} onClose={cancel} size='large'>
        {reviewDecision?.decision === 'reject' && (
          <Box>
            <Typography sx={{ mb: 1, whiteSpace: 'pre' }}>
              Please confirm you want to <b>reject</b> this application.
            </Typography>
            <Typography sx={{ mb: 1, whiteSpace: 'pre' }}>
              The submitter will be disqualified from making further changes
            </Typography>
          </Box>
        )}

        <Typography>This decision is permanent.</Typography>

        <Box display='flex' gap={2} mt={3}>
          {reviewDecision?.decision === 'reject' && (
            <Button color='error' onClick={() => makeSubmissionDecision('reject')}>
              Reject application
            </Button>
          )}

          <Button variant='outlined' color='secondary' onClick={cancel}>
            Cancel
          </Button>
        </Box>
      </Modal>
    </Stack>
  );
}
