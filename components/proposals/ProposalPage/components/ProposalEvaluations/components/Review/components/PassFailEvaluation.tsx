import type { ProposalEvaluationResult } from '@charmverse/core/prisma-client';
import styled from '@emotion/styled';
import { ThumbUpOutlined as ApprovedIcon, ThumbDownOutlined as RejectedIcon } from '@mui/icons-material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Box, Card, Chip, FormLabel, MenuItem, Select, Stack, TextField, Tooltip, Typography } from '@mui/material';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useState } from 'react';

import { Button } from 'components/common/Button';
import { UserAndRoleSelect } from 'components/common/DatabaseEditor/components/properties/UserAndRoleSelect';
import Modal from 'components/common/Modal';
import UserDisplay from 'components/common/UserDisplay';
import { allMembersSystemRole } from 'components/settings/proposals/components/EvaluationPermissions';
import { useConfirmationModal } from 'hooks/useConfirmationModal';
import { useUser } from 'hooks/useUser';
import { getActionButtonLabels } from 'lib/proposals/getActionButtonLabels';
import type { PopulatedEvaluation } from 'lib/proposals/interfaces';
import { getRelativeTimeInThePast } from 'lib/utils/dates';

export type PassFailEvaluationProps = {
  isAppealProcess?: boolean;
  confirmationMessage?: string;
  hideReviewer?: boolean;
  isCurrent: boolean;
  isReviewer?: boolean;
  archived?: boolean;
  onSubmitEvaluationReview: (params: {
    declineReason: string | null;
    result: NonNullable<PopulatedEvaluation['result']>;
    declineInput?: string;
  }) => Promise<void>;
  onResetEvaluationReview?: () => void;
  isResettingEvaluationReview: boolean;
  reviewerOptions: {
    group: string;
    id: string;
  }[];
  isSubmittingReview: boolean;
  evaluationReviews?: {
    id: string;
    reviewerId: string;
    declineReasons: string[];
    declineInput?: string | null;
    result: ProposalEvaluationResult;
    completedAt: Date;
  }[];
  requiredReviews: number;
  evaluationResult?: PopulatedEvaluation['result'];
  declineReasonOptions: string[];
  completedAt?: Date | null;
  actionLabels?: PopulatedEvaluation['actionLabels'];
};

const ResultCopyStack = styled(Stack)<{ addPaddingTop?: boolean }>`
  flex-direction: row;
  gap: ${({ theme }) => theme.spacing(1)};
  align-items: center;
  justify-content: center;
  padding-bottom: ${({ theme }) => theme.spacing(2)};
  padding-left: ${({ theme }) => theme.spacing(2)};
  padding-right: ${({ theme }) => theme.spacing(2)};
  padding-top: ${({ addPaddingTop, theme }) => (addPaddingTop ? theme.spacing(2) : 0)};
`;

export function PassFailEvaluation({
  isCurrent,
  isReviewer,
  archived,
  onSubmitEvaluationReview,
  hideReviewer,
  reviewerOptions,
  isSubmittingReview,
  evaluationReviews = [],
  requiredReviews,
  evaluationResult,
  isResettingEvaluationReview,
  onResetEvaluationReview,
  declineReasonOptions,
  completedAt,
  actionLabels: _actionLabels,
  confirmationMessage,
  isAppealProcess
}: PassFailEvaluationProps) {
  const { user } = useUser();
  const currentUserEvaluationReview = evaluationReviews?.find((review) => review.reviewerId === user?.id);
  const [declineReason, setDeclineReason] = useState<string | null>(null);
  const [evaluationReviewId, setEvaluationReviewId] = useState<string | null>(null);
  const [declineInput, setDeclineInput] = useState('');
  const declineReasonModalPopupState = usePopupState({ variant: 'dialog' });
  const disabledTooltip = !isCurrent
    ? 'This evaluation step is not active'
    : !isReviewer
    ? 'You are not a reviewer'
    : isSubmittingReview
    ? 'Submitting review'
    : archived
    ? 'You cannot move an archived proposal'
    : null;
  const completedDate = completedAt ? getRelativeTimeInThePast(new Date(completedAt)) : null;
  const evaluationReviewDeclineInputPopupState = usePopupState({ variant: 'popover' });

  const actionLabels = getActionButtonLabels({
    actionLabels: _actionLabels
  });
  const canReview =
    isReviewer && evaluationReviews.length < requiredReviews && !evaluationResult && !currentUserEvaluationReview;
  const { showConfirmation } = useConfirmationModal();

  const _onSubmitEvaluationReview = async (result: NonNullable<PopulatedEvaluation['result']>) => {
    if (confirmationMessage) {
      const { confirmed } = await showConfirmation({
        message: confirmationMessage,
        confirmButton: result === 'pass' ? actionLabels.approve : actionLabels.reject
      });
      if (!confirmed) {
        return;
      }
    }

    await onSubmitEvaluationReview({
      declineReason,
      result,
      declineInput
    });
  };

  function onClose() {
    setDeclineReason(null);
    setDeclineInput('');
    setEvaluationReviewId(null);
    declineReasonModalPopupState.close();
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
              value={reviewerOptions}
              onChange={() => {}}
            />
          </Box>
          <FormLabel>
            <Typography variant='subtitle1'>
              Result{requiredReviews !== 1 ? ` (required ${requiredReviews})` : ''}
            </Typography>
          </FormLabel>
        </>
      )}
      <Card variant='outlined'>
        {evaluationReviews.length > 0 && (
          <Stack p={2} gap={2.5}>
            {evaluationReviews.map((evaluationReview) => {
              return (
                <Stack key={evaluationReview.id} gap={1.5}>
                  <Stack direction='row' justifyContent='space-between' alignItems='center'>
                    <Stack direction='row' gap={1} alignItems='center'>
                      <UserDisplay userId={evaluationReview.reviewerId} avatarSize='xSmall' />
                      <Typography variant='subtitle1'>
                        {getRelativeTimeInThePast(new Date(evaluationReview.completedAt))}
                      </Typography>
                    </Stack>
                    <Stack direction='row' gap={1.5} alignItems='center'>
                      {onResetEvaluationReview && evaluationReview.reviewerId === user?.id && !evaluationResult && (
                        <Button
                          size='small'
                          color='secondary'
                          variant='outlined'
                          loading={isResettingEvaluationReview}
                          onClick={onResetEvaluationReview}
                        >
                          Undo
                        </Button>
                      )}
                      {evaluationReview.result === 'pass' ? (
                        <ApprovedIcon fontSize='small' color='success' />
                      ) : (
                        <RejectedIcon fontSize='small' color='error' />
                      )}
                    </Stack>
                  </Stack>
                  {evaluationReview.result === 'fail' && evaluationReview.declineReasons.length ? (
                    <Stack direction='row' justifyContent='space-between' alignItems='center'>
                      <Stack flexDirection='row' gap={1.5}>
                        {evaluationReview.declineReasons.map((reason) => (
                          <Chip size='small' variant='outlined' key={reason} label={reason} sx={{ mr: 0.5 }} />
                        ))}
                      </Stack>
                      {evaluationReview.declineInput && (
                        <Tooltip title='View additional comment'>
                          <div>
                            <InfoOutlinedIcon
                              sx={{
                                cursor: 'pointer'
                              }}
                              onClick={() => {
                                setEvaluationReviewId(evaluationReview.id);
                                evaluationReviewDeclineInputPopupState.open();
                              }}
                              fontSize='small'
                              color='secondary'
                            />
                          </div>
                        </Tooltip>
                      )}
                    </Stack>
                  ) : null}
                </Stack>
              );
            })}
          </Stack>
        )}

        {canReview && (
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
                  if (declineReasonOptions.length) {
                    declineReasonModalPopupState.open();
                  } else {
                    _onSubmitEvaluationReview('fail');
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
                onClick={() => _onSubmitEvaluationReview('pass')}
                disabled={!!disabledTooltip}
                disabledTooltip={disabledTooltip}
                color='successPale'
              >
                {actionLabels.approve}
              </Button>
            </Box>
          </Box>
        )}
        {!canReview && isCurrent && evaluationResult === null && evaluationReviews.length === 0 && (
          <Stack flexDirection='row' gap={1} alignItems='center' justifyContent='center' py={2} px={2}>
            <Typography variant='body2'>{isAppealProcess ? 'Appeal' : 'Review'} process ongoing</Typography>
          </Stack>
        )}
        {evaluationResult === 'pass' && (
          <ResultCopyStack addPaddingTop={evaluationReviews.length === 0}>
            <ApprovedIcon color='success' />
            <Typography variant='body2'>Approved {completedDate}</Typography>
          </ResultCopyStack>
        )}
        {evaluationResult === 'fail' && (
          <ResultCopyStack addPaddingTop={evaluationReviews.length === 0}>
            <RejectedIcon color='error' />
            <Typography variant='body2'>Declined {completedDate}</Typography>
          </ResultCopyStack>
        )}
      </Card>
      <Modal open={!!declineReasonModalPopupState.isOpen} onClose={onClose} title='Reason for decline' size='small'>
        <Stack gap={1} mb={3}>
          <Typography>Please select at least one reason for declining this proposal.</Typography>
          <Select
            value={declineReason}
            onChange={(e) => {
              setDeclineReason(e.target.value);
            }}
            renderValue={(selected) => <Chip size='small' variant='outlined' label={selected} sx={{ mr: 0.5 }} />}
          >
            {declineReasonOptions.map((reason) => (
              <MenuItem key={reason} value={reason}>
                {reason}
              </MenuItem>
            ))}
          </Select>
        </Stack>

        <Stack gap={1}>
          <Typography>Additional comment</Typography>
          <TextField
            multiline
            fullWidth
            rows={5}
            onChange={(e) => {
              setDeclineInput(e.target.value);
            }}
            value={declineInput}
          />
        </Stack>

        <Box display='flex' justifyContent='flex-end' mt={3} gap={2}>
          <Button color='secondary' variant='outlined' onClick={onClose}>
            Cancel
          </Button>
          <Button
            color='error'
            sx={{
              fontWeight: 'bold'
            }}
            loading={isResettingEvaluationReview || isSubmittingReview}
            data-testid='confirm-delete-button'
            onClick={async () => {
              await _onSubmitEvaluationReview('fail');
              onClose();
            }}
            disabled={declineReason === null}
          >
            {actionLabels.reject}
          </Button>
        </Box>
      </Modal>

      {evaluationReviewId && !!evaluationReviewDeclineInputPopupState.isOpen && (
        <Modal open onClose={onClose} title='Additional comment' size='small'>
          <TextField
            multiline
            rows={10}
            fullWidth
            value={evaluationReviews.find((review) => review.id === evaluationReviewId)?.declineInput}
            disabled
          />
        </Modal>
      )}
    </>
  );
}
