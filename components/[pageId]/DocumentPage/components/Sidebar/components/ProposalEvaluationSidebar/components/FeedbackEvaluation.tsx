import { ThumbUpOutlined as ApprovedIcon, ThumbDownOutlined as RejectedIcon } from '@mui/icons-material';
import { Box, FormLabel, Stack, Typography } from '@mui/material';

import { useUpdateProposalEvaluation } from 'charmClient/hooks/proposals';
import { UserAndRoleSelect } from 'components/common/BoardEditor/components/properties/UserAndRoleSelect';
import { Button } from 'components/common/Button';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useMembers } from 'hooks/useMembers';
import { useUser } from 'hooks/useUser';
import type { ProposalWithUsersAndRubric, PopulatedEvaluation } from 'lib/proposal/interface';
import { getRelativeTimeInThePast } from 'lib/utilities/dates';

export type Props = {
  proposal?: Pick<ProposalWithUsersAndRubric, 'id' | 'authors' | 'evaluations' | 'status' | 'evaluationType'>;
  evaluation: PopulatedEvaluation;
  refreshProposal?: VoidFunction;
  isCurrent: boolean;
};

export function FeedbackEvaluation({ proposal, isCurrent, evaluation, refreshProposal }: Props) {
  const isAdmin = useIsAdmin();
  const { user } = useUser();
  const { trigger: updateProposalEvaluation, isMutating } = useUpdateProposalEvaluation({ proposalId: proposal?.id });

  const reviewerOptions = evaluation.permissions
    .filter((permission) => permission.operation === 'move')
    .map((permission) => ({
      group: permission.roleId ? 'role' : permission.userId ? 'user' : 'system_role',
      id: (permission.roleId ?? permission.userId ?? permission.systemRole) as string
    }));
  const currentEvaluationIndex = proposal?.evaluations.findIndex((e) => e.id === evaluation.id) || -1;
  const nextEvaluation = proposal?.evaluations[currentEvaluationIndex + 1];
  const isMover = isAdmin || proposal?.authors.some((author) => author.userId === user?.id);
  const disabledTooltip = !isCurrent
    ? 'Evaluation is not in feedback'
    : !isMover
    ? 'You do not have permission to move this evaluation'
    : null;
  async function onMoveForward() {
    await updateProposalEvaluation({
      evaluationId: evaluation.id,
      result: 'pass'
    });
    refreshProposal?.();
  }

  return (
    <>
      <Box mb={2}>
        <FormLabel>
          <Typography component='span' variant='subtitle1'>
            {evaluation.type === 'vote' ? 'Vote privileges' : 'Reviewer'}
          </Typography>
        </FormLabel>
        <UserAndRoleSelect readOnly={true} value={reviewerOptions} onChange={() => {}} />
      </Box>
      <Box display='flex' justifyContent='flex-end' alignItems='center'>
        {/* <FormLabel>
            <Typography component='span' variant='subtitle1'>
              Move to next evaluation when feedback is complete
            </Typography>
          </FormLabel> */}
        <Box display='flex' justifyContent='flex-end' gap={1}>
          <Button
            loading={isMutating}
            onClick={onMoveForward}
            disabled={!!disabledTooltip}
            disabledTooltip={disabledTooltip}
          >
            Move to {nextEvaluation?.title}
          </Button>
        </Box>
      </Box>
    </>
  );
}
