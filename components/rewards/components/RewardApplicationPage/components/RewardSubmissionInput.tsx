import { isEmptyDocument } from '@bangle.dev/utils';
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
import { CharmEditor } from 'components/common/CharmEditor';
import { useUser } from 'hooks/useUser';
import type { BountyPermissionFlags } from 'lib/permissions/bounties';
import { checkIsContentEmpty } from 'lib/prosemirror/checkIsContentEmpty';
import type { PageContent } from 'lib/prosemirror/interfaces';
import type { RewardType } from 'lib/rewards/interfaces';
import type { WorkUpsertData } from 'lib/rewards/work';
import { isValidChainAddress } from 'lib/tokens/validation';
import type { SystemError } from 'lib/utils/errors';

import { RewardApplicationStatusChip, applicationStatuses } from '../../RewardApplicationStatusChip';

const schema = (rewardType: RewardType) => {
  return yup.object({
    submission: yup.string().required(),
    submissionNodes: yup.mixed<string>().required(),
    walletAddress:
      rewardType === 'token'
        ? yup
            .string()
            .required()
            .test('verifyContractFormat', 'Invalid wallet address', (address) => {
              if (address.endsWith('eth')) {
                return true;
              }
              return isValidChainAddress(address);
            })
        : yup.string(),
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
  rewardType: RewardType;
  refreshSubmission: VoidFunction;
  currentUserIsAuthor: boolean;
  isSaving?: boolean;
}

export function RewardSubmissionInput({
  permissions,
  readOnly = false,
  submission,
  onSubmit: onSubmitProp,
  rewardType,
  currentUserIsAuthor,
  isSaving
}: Props) {
  const { user } = useUser();
  const [isEditorTouched, setIsEditorTouched] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isValid }
  } = useForm<FormValues>({
    mode: 'onChange',
    defaultValues: {
      submission: submission?.submission as string,
      submissionNodes: submission?.submissionNodes as any as string,
      walletAddress: submission?.walletAddress ?? user?.wallets[0]?.address ?? ''
    },
    resolver: yupResolver(schema(rewardType))
  });

  const formValues = getValues();

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
            <CharmEditor
              content={submission?.submissionNodes ? JSON.parse(submission?.submissionNodes) : null}
              onContentChange={(content) => {
                setValue('submission', content.rawText, {
                  shouldValidate: true
                });
                setValue('submissionNodes', content.doc as any as string, {
                  shouldValidate: true
                });
                setIsEditorTouched(true);
              }}
              style={{
                backgroundColor: 'var(--input-bg)',
                border: '1px solid var(--input-border)',
                borderRadius: 3,
                minHeight: 130,
                left: 0
              }}
              readOnly={readOnly || submission?.status === 'complete' || submission?.status === 'paid'}
              placeholderText={currentUserIsAuthor ? 'Enter your submission here' : 'No submission yet'}
              key={`${readOnly}.${submission?.status}`}
              disableRowHandles
              isContentControlled
              disableNestedPages
            />
          </Grid>

          {(currentUserIsAuthor || permissions?.review) && rewardType === 'token' && (
            <Grid item>
              <InputLabel>Address/ENS to receive reward</InputLabel>
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

          {(currentUserIsAuthor || permissions?.review) && rewardType === 'custom' && (
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
                disabled={
                  (!isValid && submission?.status === 'inProgress') ||
                  !isEditorTouched ||
                  checkIsContentEmpty(formValues.submissionNodes as unknown as PageContent)
                }
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
