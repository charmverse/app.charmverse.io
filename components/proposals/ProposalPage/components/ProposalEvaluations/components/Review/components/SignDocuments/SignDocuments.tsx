import { ThumbUpOutlined as ApprovedIcon, ThumbDownOutlined as RejectedIcon } from '@mui/icons-material';
import PanToolIcon from '@mui/icons-material/PanTool';
import { Box, Card, Chip, FormLabel, MenuItem, Select, Stack, Typography } from '@mui/material';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useEffect, useState } from 'react';

import {
  useAppealProposalEvaluation,
  useResetEvaluationAppealReview,
  useResetEvaluationReview,
  useSubmitEvaluationAppealReview,
  useSubmitEvaluationReview
} from 'charmClient/hooks/proposals';
import { useProposal } from 'components/[pageId]/DocumentPage/hooks/useProposal';
import { Button } from 'components/common/Button';
import { UserAndRoleSelect } from 'components/common/DatabaseEditor/components/properties/UserAndRoleSelect';
import Modal from 'components/common/Modal';
import MultiTabs from 'components/common/MultiTabs';
import UserDisplay from 'components/common/UserDisplay';
import { allMembersSystemRole } from 'components/settings/proposals/components/EvaluationPermissions';
import { useConfirmationModal } from 'hooks/useConfirmationModal';
import { useMembers } from 'hooks/useMembers';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import { getActionButtonLabels } from 'lib/proposals/getActionButtonLabels';
import type { PopulatedEvaluation } from 'lib/proposals/interfaces';
import { getRelativeTimeInThePast } from 'lib/utils/dates';

import { SearchDocusign } from './SearchDocusign';

export type Props = {
  proposalId: string;
  evaluation: Pick<
    PopulatedEvaluation,
    | 'id'
    | 'completedAt'
    | 'reviewers'
    | 'result'
    | 'isReviewer'
    | 'actionLabels'
    | 'requiredReviews'
    | 'reviews'
    | 'declineReasonOptions'
    | 'appealable'
    | 'appealRequiredReviews'
    | 'appealReviewers'
    | 'type'
    | 'appealedAt'
    | 'appealedBy'
    | 'declinedAt'
    | 'isAppealReviewer'
  >;
  isCurrent: boolean;
  isAuthor?: boolean;
  isReviewer?: boolean;
  evaluationResult?: PopulatedEvaluation['result'];
  completedAt?: Date | null;
  refreshProposal: VoidFunction;
};

export function SignDocuments({
  proposalId,
  isCurrent,
  isReviewer,
  isAuthor,
  evaluation,
  evaluationResult,
  completedAt,
  refreshProposal
}: Props) {
  const completedDate = completedAt ? getRelativeTimeInThePast(new Date(completedAt)) : null;

  const reviewerOptions = evaluation.reviewers.map((reviewer) => ({
    id: (reviewer.roleId ?? reviewer.userId) as string,
    group: reviewer.roleId ? 'role' : 'user'
  }));

  return (
    <>
      <Box mb={2}>
        <FormLabel>
          <Typography sx={{ mb: 1 }} variant='subtitle1'>
            Document preparers
          </Typography>
        </FormLabel>
        <UserAndRoleSelect
          data-test='evaluation-reviewer-select'
          systemRoles={[]}
          readOnly={true}
          value={reviewerOptions}
          onChange={() => {}}
        />
      </Box>
      {(isAuthor || isReviewer) && (
        <Card variant='outlined'>
          {isReviewer && (
            <Box display='flex' width='100%' justifyContent='space-between' alignItems='center' p={2}>
              <SearchDocusign selectedEnvelopeIds={[]} onSelectEnvelope={() => null} proposalId={proposalId} />
            </Box>
          )}

          {evaluationResult === 'pass' && (
            <Stack flexDirection='row' gap={1} alignItems='center' justifyContent='center' pb={2} px={2}>
              <ApprovedIcon color='success' />
              <Typography variant='body2'>Signed {completedDate}</Typography>
            </Stack>
          )}
          {evaluationResult === 'fail' && (
            <Stack flexDirection='row' gap={1} alignItems='center' justifyContent='center' pb={2} px={2}>
              <RejectedIcon color='error' />
              <Typography variant='body2'>Cancelled {completedDate}</Typography>
            </Stack>
          )}
        </Card>
      )}
    </>
  );
}
