import { Tooltip } from '@mui/material';

import { useGoBackToStep } from 'charmClient/hooks/proposals';
import { Button } from 'components/common/Button';
import type { ProposalEvaluationValues } from 'components/proposals/ProposalPage/components/ProposalEvaluations/components/Settings/components/EvaluationStepSettings';
import { useConfirmationModal } from 'hooks/useConfirmationModal';
import { useSnackbar } from 'hooks/useSnackbar';
import type { PopulatedEvaluation } from 'lib/proposals/interfaces';

export function ResetResultButton({
  evaluation,
  proposalId,
  onSubmit,
  archived,
  hasMovePermission
}: {
  evaluation: Pick<ProposalEvaluationValues, 'id' | 'type'>;
  archived?: boolean;
  proposalId?: string;
  onSubmit?: () => void;
  hasMovePermission: boolean;
}) {
  const { showConfirmation } = useConfirmationModal();
  const { showMessage } = useSnackbar();
  const { trigger: goBackToStep, isMutating: isSavingEvaluation } = useGoBackToStep({
    proposalId
  });

  const disabledTooltip = !hasMovePermission
    ? 'You do not have permission to move reset results of this proposal'
    : evaluation.type === 'vote'
      ? 'You cannot revert the results of a vote'
      : archived
        ? 'You cannot reset an archived proposal'
        : '';

  async function resetStep() {
    try {
      await goBackToStep({ evaluationId: evaluation.id });
    } catch (error) {
      showMessage((error as Error).message, 'error');
    }
    onSubmit?.();
  }

  async function onClick() {
    const { confirmed } = await showConfirmation({
      message: 'Do you want to clear result of current evaluation?',
      confirmButton: 'Continue'
    });

    if (confirmed) {
      resetStep();
    }
  }

  return (
    <Tooltip title={disabledTooltip || 'Reset evaluation result'}>
      <span>
        <Button
          color='secondary'
          loading={isSavingEvaluation}
          size='small'
          variant='outlined'
          onClick={onClick}
          disabled={!!disabledTooltip}
        >
          Reset
        </Button>
      </span>
    </Tooltip>
  );
}
