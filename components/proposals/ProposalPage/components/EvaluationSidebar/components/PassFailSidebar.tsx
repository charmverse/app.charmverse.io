import { ThumbUpOutlined as ApprovedIcon, ThumbDownOutlined as RejectedIcon } from '@mui/icons-material';
import { Box, FormLabel, Stack, Typography } from '@mui/material';

import { useUpdateProposalEvaluation } from 'charmClient/hooks/proposals';
import { UserAndRoleSelect } from 'components/common/BoardEditor/components/properties/UserAndRoleSelect';
import { Button } from 'components/common/Button';
import { allMembersSystemRole } from 'components/settings/proposals/components/EvaluationPermissions';
import type { ProposalWithUsersAndRubric, PopulatedEvaluation } from 'lib/proposal/interface';
import { getRelativeTimeInThePast } from 'lib/utilities/dates';

export type Props = {
  proposal?: Pick<ProposalWithUsersAndRubric, 'id' | 'permissions'>;
  evaluation: PopulatedEvaluation;
  refreshProposal?: VoidFunction;
  isCurrent: boolean;
};

export function PassFailSidebar({ proposal, evaluation, isCurrent, refreshProposal }: Props) {
  const { trigger: updateProposalEvaluation } = useUpdateProposalEvaluation({ proposalId: proposal?.id });

  const reviewerOptions = evaluation.reviewers.map((reviewer) => ({
    group: reviewer.roleId ? 'role' : reviewer.userId ? 'user' : 'system_role',
    id: (reviewer.roleId ?? reviewer.userId ?? reviewer.systemRole) as string
  }));

  const isReviewer = proposal?.permissions.evaluate;
  const completedDate = evaluation.completedAt ? getRelativeTimeInThePast(new Date(evaluation.completedAt)) : null;
  const disabledTooltip = !isCurrent
    ? 'This evaluation step is not active'
    : !isReviewer
    ? 'You are not a reviewer'
    : null;

  async function onSubmitReview(result: NonNullable<PopulatedEvaluation['result']>) {
    await updateProposalEvaluation({
      evaluationId: evaluation.id,
      result
    });
    refreshProposal?.();
  }

  return (
    <>
      <Box mb={2}>
        <FormLabel>
          <Typography sx={{ mb: 1 }} variant='subtitle1'>
            Reviewer
          </Typography>
        </FormLabel>
        <UserAndRoleSelect
          systemRoles={[allMembersSystemRole]}
          readOnly={true}
          value={reviewerOptions}
          onChange={() => {}}
        />
      </Box>
      {!evaluation.result && (
        <Box display='flex' justifyContent='space-between' alignItems='center'>
          <FormLabel>
            <Typography component='span' variant='subtitle1'>
              Submit review:
            </Typography>
          </FormLabel>
          <Box display='flex' justifyContent='flex-end' gap={1}>
            <Button
              onClick={() => onSubmitReview('fail')}
              disabled={!!disabledTooltip}
              disabledTooltip={disabledTooltip}
              color='error'
            >
              Decline
            </Button>
            <Button
              onClick={() => onSubmitReview('pass')}
              disabled={!!disabledTooltip}
              disabledTooltip={disabledTooltip}
              color='success'
            >
              Pass
            </Button>
          </Box>
        </Box>
      )}
      {evaluation.result === 'pass' && (
        <Stack flexDirection='row' gap={2} alignItems='center'>
          <ApprovedIcon color='success' fontSize='large' />
          <Box>
            <Typography>Approved {completedDate}</Typography>
          </Box>
        </Stack>
      )}
      {evaluation.result === 'fail' && (
        <Stack flexDirection='row' gap={2} alignItems='center'>
          <RejectedIcon color='error' fontSize='large' />
          <Box>
            <Typography>Declined {completedDate}</Typography>
          </Box>
        </Stack>
      )}
    </>
  );
}
