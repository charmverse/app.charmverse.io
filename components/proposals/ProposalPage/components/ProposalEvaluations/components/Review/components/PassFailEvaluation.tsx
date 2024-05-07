import { ThumbUpOutlined as ApprovedIcon, ThumbDownOutlined as RejectedIcon } from '@mui/icons-material';
import { Box, Card, Chip, FormLabel, MenuItem, Select, Stack, Typography } from '@mui/material';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useState } from 'react';

import { useSubmitEvaluationResult } from 'charmClient/hooks/proposals';
import { Button } from 'components/common/Button';
import type { SelectOption } from 'components/common/DatabaseEditor/components/properties/UserAndRoleSelect';
import { UserAndRoleSelect } from 'components/common/DatabaseEditor/components/properties/UserAndRoleSelect';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import { allMembersSystemRole } from 'components/settings/proposals/components/EvaluationPermissions';
import { useConfirmationModal } from 'hooks/useConfirmationModal';
import { useSnackbar } from 'hooks/useSnackbar';
import { getActionButtonLabels } from 'lib/proposals/getActionButtonLabels';
import type { PopulatedEvaluation } from 'lib/proposals/interfaces';
import { getRelativeTimeInThePast } from 'lib/utils/dates';

export type Props = {
  hideReviewer?: boolean;
  proposalId?: string;
  evaluation: Pick<
    PopulatedEvaluation,
    'id' | 'completedAt' | 'reviewers' | 'result' | 'isReviewer' | 'actionLabels' | 'failReasonOptions' | 'failReasons'
  >;
  refreshProposal?: VoidFunction;
  confirmationMessage?: string;
  isCurrent: boolean;
  archived?: boolean;
};

export function PassFailEvaluation({
  proposalId,
  hideReviewer,
  evaluation,
  isCurrent,
  refreshProposal,
  confirmationMessage,
  archived
}: Props) {
  const [failReasons, setFailReasons] = useState<string[]>([]);
  const { trigger, isMutating } = useSubmitEvaluationResult({ proposalId });
  const failReasonModalPopupState = usePopupState({ variant: 'dialog' });
  const failReasonOptions = evaluation.failReasonOptions ?? [];
  const reviewerOptions = evaluation.reviewers.map((reviewer) => ({
    group: reviewer.roleId ? 'role' : reviewer.userId ? 'user' : 'system_role',
    id: (reviewer.roleId ?? reviewer.userId ?? reviewer.systemRole) as string
  }));
  const { showConfirmation } = useConfirmationModal();
  const { showMessage } = useSnackbar();

  const completedDate = evaluation.completedAt ? getRelativeTimeInThePast(new Date(evaluation.completedAt)) : null;
  const disabledTooltip = !isCurrent
    ? 'This evaluation step is not active'
    : !evaluation.isReviewer
    ? 'You are not a reviewer'
    : isMutating
    ? 'Submitting review'
    : archived
    ? 'You cannot move an archived proposal'
    : null;

  const actionLabels = getActionButtonLabels(evaluation);

  async function onSubmitReview(result: NonNullable<PopulatedEvaluation['result']>) {
    if (confirmationMessage) {
      const { confirmed } = await showConfirmation({
        message: confirmationMessage,
        confirmButton: result === 'pass' ? actionLabels.approve : actionLabels.reject
      });
      if (!confirmed) {
        return;
      }
    }
    try {
      await trigger({
        evaluationId: evaluation.id,
        result,
        failReasons
      });
      refreshProposal?.();
    } catch (error) {
      showMessage((error as Error).message, 'error');
    }
  }

  return (
    <>
      {!hideReviewer && (
        <>
          <Box mb={2}>
            <FormLabel>
              <Typography sx={{ mb: 1 }} variant='subtitle1'>
                Reviewers
              </Typography>
            </FormLabel>
            <UserAndRoleSelect
              data-test='evaluation-reviewer-select'
              systemRoles={[allMembersSystemRole]}
              readOnly={true}
              value={reviewerOptions as SelectOption[]}
              onChange={() => {}}
            />
          </Box>
          <FormLabel>
            <Typography variant='subtitle1'>Result</Typography>
          </FormLabel>
        </>
      )}
      <Card variant='outlined'>
        {!evaluation.result && (
          <Box display='flex' justifyContent='space-between' alignItems='center' p={2}>
            <FormLabel>
              <Typography component='span' variant='subtitle1'>
                Submit review:
              </Typography>
            </FormLabel>
            <Box display='flex' justifyContent='flex-end' gap={1}>
              <Button
                data-test='evaluation-fail-button'
                onClick={() => {
                  if (failReasonOptions.length) {
                    failReasonModalPopupState.open();
                  } else {
                    onSubmitReview('fail');
                  }
                }}
                disabled={!!disabledTooltip}
                disabledTooltip={disabledTooltip}
                color='errorPale'
              >
                {actionLabels.reject}
              </Button>
              <Button
                data-test='evaluation-pass-button'
                onClick={() => onSubmitReview('pass')}
                disabled={!!disabledTooltip}
                disabledTooltip={disabledTooltip}
                color='successPale'
              >
                {actionLabels.approve}
              </Button>
            </Box>
          </Box>
        )}
        {evaluation.result === 'pass' && (
          <Stack flexDirection='row' gap={1} alignItems='center' justifyContent='center' p={2}>
            <ApprovedIcon color='success' />
            <Typography variant='body2'>Approved {completedDate}</Typography>
          </Stack>
        )}
        {evaluation.result === 'fail' && (
          <Stack>
            <Stack flexDirection='row' gap={1} alignItems='center' justifyContent='center' p={2}>
              <RejectedIcon color='error' />
              <Typography variant='body2'>Declined {completedDate}</Typography>
            </Stack>
          </Stack>
        )}
      </Card>
      {evaluation.result === 'fail' && evaluation.failReasons.length ? (
        <Stack mt={2} gap={1}>
          <FormLabel>
            <Typography component='span' variant='subtitle1'>
              Fail reasons:
            </Typography>
          </FormLabel>
          <Stack flexDirection='row' gap={1}>
            {evaluation.failReasons.map((reason) => (
              <Chip size='small' variant='outlined' key={reason} label={reason} sx={{ mr: 0.5 }} />
            ))}
          </Stack>
        </Stack>
      ) : null}
      <ConfirmDeleteModal
        onClose={() => {
          setFailReasons([]);
          failReasonModalPopupState.close();
        }}
        onConfirm={async () => {
          await onSubmitReview('fail');
          setFailReasons([]);
          failReasonModalPopupState.close();
        }}
        open={!!failReasonModalPopupState.isOpen}
        question={
          <Stack gap={1}>
            <Typography>Please select at least one reason for declining this proposal.</Typography>
            <Select
              value={failReasons}
              onChange={(e) => {
                setFailReasons(e.target.value as string[]);
              }}
              renderValue={(selected) =>
                selected.map((reason) => (
                  <Chip size='small' variant='outlined' key={reason} label={reason} sx={{ mr: 0.5 }} />
                ))
              }
              multiple
            >
              {failReasonOptions.map((reason) => (
                <MenuItem key={reason} value={reason}>
                  {reason}
                </MenuItem>
              ))}
            </Select>
          </Stack>
        }
        disabled={failReasons.length === 0}
        buttonText={actionLabels.reject}
        primaryButtonColor='error'
        title='Reason for decline'
      />
    </>
  );
}
