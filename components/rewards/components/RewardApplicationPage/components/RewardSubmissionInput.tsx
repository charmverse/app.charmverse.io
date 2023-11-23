import type { Application } from '@charmverse/core/prisma';
import { yupResolver } from '@hookform/resolvers/yup';
import { Box, FormLabel } from '@mui/material';
import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import { Button } from 'components/common/Button';
import InlineCharmEditor from 'components/common/CharmEditor/InlineCharmEditor';
import { useUser } from 'hooks/useUser';
import type { BountyPermissionFlags } from 'lib/permissions/bounties';
import type { WorkUpsertData } from 'lib/rewards/work';
import { isValidChainAddress } from 'lib/tokens/validation';
import type { SystemError } from 'lib/utilities/errors';

import { RewardApplicationStatusChip, applicationStatuses } from '../../RewardApplicationStatusChip';

const schema = (customReward?: boolean) => {
  return yup.object({
    submission: yup.string().required(),
    submissionNodes: yup.mixed().required(),
    walletAddress: (customReward ? yup.string() : yup.string().required()).test(
      'verifyContractFormat',
      'Invalid wallet address',
      (value) => (customReward ? true : isValidChainAddress(value))
    ),
    rewardInfo: yup.string()
  });
};

type FormValues = yup.InferType<ReturnType<typeof schema>>;

interface Props {
  submission?: Application;
  bountyId?: string;
  onSubmit: (
    content: Partial<
      Pick<WorkUpsertData, 'submission' | 'submissionNodes' | 'walletAddress' | 'rewardInfo' | 'applicationId'>
    >
  ) => Promise<boolean>;
  readOnly?: boolean;
  permissions?: BountyPermissionFlags;
  expandedOnLoad?: boolean;
  alwaysExpanded?: boolean;
  hasCustomReward: boolean;
  refreshSubmission: VoidFunction;
  currentUserIsAuthor: boolean;
  isSaving?: boolean;
}

export function RewardSubmissionInput({
  permissions,
  readOnly = false,
  submission,
  onSubmit: onSubmitProp,
  hasCustomReward,
  currentUserIsAuthor,
  isSaving
}: Props) {
  const { user } = useUser();
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
      walletAddress: submission ? submission?.walletAddress || '' : user?.wallets[0]?.address
    },
    resolver: yupResolver(schema(hasCustomReward))
  });

  const [formError, setFormError] = useState<SystemError | null>(null);

  async function onSubmit(values: FormValues) {
    const hasSaved = await onSubmitProp({
      applicationId: submission?.id,
      ...values
    });
    if (hasSaved) {
      setFormError(null);
      setIsEditorTouched(false);
    }
  }

  return (
    <Stack my={2} gap={1}>
      <Box display='flex' justifyContent='space-between' flexDirection='row' gap={0.5}>
        <Box display='flex' gap={0.5}>
          <FormLabel sx={{ fontWeight: 'bold', cursor: 'pointer' }}>
            {!submission || currentUserIsAuthor ? 'Your submission' : 'Submission'}
          </FormLabel>
        </Box>
        {submission && !applicationStatuses.includes(submission?.status) && (
          <RewardApplicationStatusChip status={submission.status} />
        )}
      </Box>
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
              placeholderText={currentUserIsAuthor ? 'Enter your submission here' : 'No submission yet'}
              key={`${readOnly}.${submission?.status}`}
            />
          </Grid>

          {(currentUserIsAuthor || permissions?.review) && !hasCustomReward && (
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

          {(currentUserIsAuthor || permissions?.review) && hasCustomReward && (
            <Grid item>
              <InputLabel>Information for custom reward</InputLabel>
              <TextField
                multiline
                minRows={2}
                {...register('rewardInfo')}
                type='text'
                fullWidth
                error={!!errors.rewardInfo}
                helperText={errors.rewardInfo?.message}
                disabled={!currentUserIsAuthor || submission?.status !== 'inProgress'}
              />
            </Grid>
          )}

          {!readOnly && (
            <Grid item display='flex' gap={1} justifyContent='flex-end'>
              <Button
                disabled={(!isValid && submission?.status === 'inProgress') || !isEditorTouched}
                type='submit'
                loading={isSaving}
              >
                {submission?.id ? 'Update' : 'Submit'}
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
    </Stack>
  );
}
