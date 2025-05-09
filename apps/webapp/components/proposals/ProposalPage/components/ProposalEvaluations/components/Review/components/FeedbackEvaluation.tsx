import { Box, Card, Stack, FormLabel, Typography } from '@mui/material';

import { useSubmitEvaluationReview } from 'charmClient/hooks/proposals';
import { Button } from 'components/common/Button';
import type { SelectOption } from 'components/common/DatabaseEditor/components/properties/UserAndRoleSelect';
import { UserAndRoleSelect } from 'components/common/DatabaseEditor/components/properties/UserAndRoleSelect';
import { authorSystemRole, allMembersSystemRole } from 'components/settings/proposals/components/EvaluationPermissions';
import { useSnackbar } from 'hooks/useSnackbar';
import type { PopulatedEvaluation } from '@packages/lib/proposals/interfaces';
import { getRelativeTimeInThePast } from '@packages/lib/utils/dates';

export type Props = {
  proposalId?: string;
  evaluation: Pick<PopulatedEvaluation, 'id' | 'completedAt' | 'reviewers' | 'result' | 'title' | 'isReviewer'>;
  isCurrent: boolean;
  nextStep?: { title: string };
  onSubmit?: VoidFunction;
  archived?: boolean;
};

export function FeedbackEvaluation({ proposalId, evaluation, isCurrent, nextStep, onSubmit, archived }: Props) {
  const { showMessage } = useSnackbar();
  const { trigger, isMutating } = useSubmitEvaluationReview({ proposalId });
  const reviewerOptions: SelectOption[] = evaluation.reviewers.map((reviewer) => ({
    group: reviewer.roleId ? 'role' : reviewer.userId ? 'user' : 'system_role',
    id: (reviewer.roleId ?? reviewer.userId ?? reviewer.systemRole) as string
  }));

  const completedDate = evaluation.completedAt ? getRelativeTimeInThePast(new Date(evaluation.completedAt)) : null;
  const disabledTooltip = !isCurrent
    ? 'This evaluation step is not active'
    : !evaluation.isReviewer
      ? 'You do not have permission to pass or reject this proposal'
      : archived
        ? 'You cannot pass or reject an archived proposal'
        : null;

  async function onMoveForward() {
    try {
      await trigger({
        evaluationId: evaluation.id,
        result: 'pass'
      });
    } catch (error) {
      showMessage((error as Error).message, 'error');
    }
    onSubmit?.();
  }

  return (
    <>
      <Box mb={2}>
        <FormLabel>
          <Typography sx={{ mb: 1 }} variant='subtitle1'>
            Reviewers
          </Typography>
        </FormLabel>
        <UserAndRoleSelect
          data-test='evaluation-reviewer-select'
          wrapColumn
          systemRoles={[authorSystemRole, allMembersSystemRole]}
          readOnly
          value={reviewerOptions}
          onChange={() => {}}
        />
      </Box>
      {/* <Card variant='outlined'> */}
      {!evaluation.result && (
        <Box display='flex' justifyContent='flex-end' alignItems='center'>
          <Button
            loading={isMutating}
            onClick={onMoveForward}
            disabled={!!disabledTooltip}
            disabledTooltip={disabledTooltip}
            data-test='pass-feedback-evaluation'
          >
            {nextStep ? `Move to ${nextStep.title}` : `Complete ${evaluation.title}`}
          </Button>
        </Box>
      )}
      {evaluation.result && (
        <Card variant='outlined'>
          <Stack flexDirection='row' gap={1} alignItems='center' justifyContent='center' p={2}>
            <Typography variant='body2'>Completed {completedDate}</Typography>
          </Stack>
        </Card>
      )}
    </>
  );
}
