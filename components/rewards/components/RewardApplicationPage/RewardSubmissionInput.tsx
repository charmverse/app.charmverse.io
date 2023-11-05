import type { Application } from '@charmverse/core/prisma';
import { yupResolver } from '@hookform/resolvers/yup';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { Box, FormLabel } from '@mui/material';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import charmClient from 'charmClient';
import InlineCharmEditor from 'components/common/CharmEditor/InlineCharmEditor';
import { useUser } from 'hooks/useUser';
import type { BountyPermissionFlags } from 'lib/permissions/bounties';
import type { WorkUpsertData } from 'lib/rewards/work';
import { isValidChainAddress } from 'lib/tokens/validation';
import type { SystemError } from 'lib/utilities/errors';

import { RewardApplicationStatusChip } from '../RewardApplicationStatusChip';

const schema = (customReward?: boolean) => {
  return yup.object({
    submission: yup.string().required(),
    submissionNodes: yup.mixed().required(),
    walletAddress: (customReward ? yup.string() : yup.string().required()).test(
      'verifyContractFormat',
      'Invalid wallet address',
      (value) => {
        return !value || isValidChainAddress(value);
      }
    ),
    rewardInfo: yup.string()
  });
};

type FormValues = yup.InferType<ReturnType<typeof schema>>;

interface Props {
  submission?: Application;
  bountyId: string;
  onSubmit?: (
    content: Partial<Pick<WorkUpsertData, 'submission' | 'submissionNodes' | 'walletAddress' | 'rewardInfo'>>
  ) => void;
  readOnly?: boolean;
  permissions?: BountyPermissionFlags;
  expandedOnLoad?: boolean;
  alwaysExpanded?: boolean;
  hasCustomReward: boolean;
  refreshSubmission: VoidFunction;
  currentUserIsApplicant: boolean;
}

export function RewardSubmissionInput({
  permissions,
  readOnly = false,
  submission,
  onSubmit: onSubmitProp,
  bountyId,
  alwaysExpanded,
  expandedOnLoad,
  hasCustomReward,
  currentUserIsApplicant
}: Props) {
  const { user } = useUser();
  const [isVisible, setIsVisible] = useState(expandedOnLoad ?? alwaysExpanded ?? false);

  const [isEditorTouched, setIsEditorTouched] = useState(false);
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
      walletAddress: submission?.walletAddress ?? user?.wallets[0]?.address
    },
    resolver: yupResolver(schema(hasCustomReward))
  });

  const [formError, setFormError] = useState<SystemError | null>(null);

  async function onSubmit(values: FormValues) {
    setFormError(null);
    const application = await charmClient.rewards.work({
      applicationId: submission?.id,
      rewardId: bountyId,
      ...values
    });
    try {
      setIsEditorTouched(false);
      if (onSubmitProp) {
        onSubmitProp(values);
      }
    } catch (err: any) {
      setFormError(err);
    }
  }

  return (
    <Stack my={2} gap={1}>
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
          <FormLabel sx={{ fontWeight: 'bold', cursor: 'pointer' }}>
            {submission?.createdBy === user?.id ? 'Your submission' : 'Submission'}
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
        {submission && <RewardApplicationStatusChip status={submission?.status} />}

        {/* {submission && submission.status !== 'applied' && submission.createdBy === user?.id && (
          <BountyApplicantStatus submission={submission} />
        )} */}
      </Box>
      <Collapse in={isVisible} timeout='auto' unmountOnExit>
        <form onSubmit={handleSubmit(onSubmit)} style={{ margin: 'auto', width: '100%' }}>
          <Grid container direction='column' spacing={2}>
            <Grid item>
              <InlineCharmEditor
                content={submission?.submissionNodes ? JSON.parse(submission?.submissionNodes) : null}
                onContentChange={(content) => {
                  setValue('submission', content.rawText, {
                    shouldValidate: true
                  });
                  setValue('submissionNodes', content.doc, {
                    shouldValidate: true
                  });
                  setIsEditorTouched(true);
                }}
                style={{
                  backgroundColor: 'var(--input-bg)',
                  border: '1px solid var(--input-border)',
                  borderRadius: 3,
                  minHeight: 130
                }}
                readOnly={readOnly || submission?.status === 'complete' || submission?.status === 'paid'}
                placeholderText={
                  permissions?.review ? 'No submission yet' : 'Enter the content of your submission here.'
                }
                key={`${readOnly}.${submission?.status}`}
              />
            </Grid>

            {(currentUserIsApplicant || permissions?.review) && !hasCustomReward && (
              <Grid item>
                <InputLabel>Address to receive reward</InputLabel>
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

            {(currentUserIsApplicant || permissions?.review) && hasCustomReward && (
              <Grid item>
                <InputLabel>Information for custom reward</InputLabel>
                <TextField
                  multiline
                  minRows={2}
                  {...register('rewardInfo')}
                  type='text'
                  fullWidth
                  error={!!errors.walletAddress}
                  helperText={errors.walletAddress?.message}
                  disabled={!currentUserIsApplicant}
                />
              </Grid>
            )}

            {!readOnly && (
              <Grid item display='flex' gap={1} justifyContent='flex-end'>
                <Button disabled={(!isValid && submission?.status === 'inProgress') || !isEditorTouched} type='submit'>
                  {submission?.submission ? 'Update' : 'Submit'}
                </Button>
              </Grid>
            )}

            {formError && (
              <Grid item>
                <Alert severity={formError.severity}>{formError.message}</Alert>
              </Grid>
            )}
          </Grid>
        </form>
      </Collapse>
    </Stack>
  );
}
