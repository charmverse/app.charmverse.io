import { Tooltip } from '@mui/material';

import { useGoBackToStep } from 'charmClient/hooks/proposals';
import { Button } from 'components/common/Button';
import { useConfirmationModal } from 'hooks/useConfirmationModal';
import { useSnackbar } from 'hooks/useSnackbar';

import type { ProposalEvaluationValues } from '../../Settings/components/EvaluationStepSettings';

export function GoBackButton({
  hasMovePermission,
  proposalId,
  previousStep,
  onSubmit,
  archived
}: {
  archived?: boolean;
  hasMovePermission: boolean;
  proposalId: string;
  previousStep?: Pick<ProposalEvaluationValues, 'id' | 'type' | 'title'>;
  onSubmit: () => void;
}) {
  const { showConfirmation } = useConfirmationModal();
  const { showMessage } = useSnackbar();
  const { trigger: goBackToStep, isMutating: isSavingEvaluation } = useGoBackToStep({
    proposalId
  });
  const disabledTooltip = !hasMovePermission
    ? 'You do not have permission to move this proposal'
    : previousStep?.type === 'vote'
      ? 'You cannot revert the results of a vote'
      : archived
        ? 'You cannot move an archived proposal'
        : '';

  async function goToPreviousStep() {
    try {
      await goBackToStep({ evaluationId: previousStep?.id || 'draft' });
    } catch (error) {
      showMessage((error as Error).message, 'error');
    }
    onSubmit?.();
  }

  async function onClick() {
    // no confirmation needed for draft or feedback
    if (!previousStep) {
      goToPreviousStep();
    } else {
      const { confirmed } = await showConfirmation({
        message: 'Moving back will clear the result of the current and previous steps and cannot be undone.',
        confirmButton: 'Continue'
      });

      if (confirmed) {
        goToPreviousStep();
      }
    }
  }

  return (
    <Tooltip title={`Move back to ${previousStep?.title || 'Draft'}`}>
      <span>
        <Button
          data-test='evaluation-go-back-button'
          color='secondary'
          loading={isSavingEvaluation}
          size='small'
          variant='outlined'
          disabled={!!disabledTooltip}
          disabledTooltip={disabledTooltip}
          onClick={onClick}
        >
          Back
        </Button>
      </span>
    </Tooltip>
  );
}
