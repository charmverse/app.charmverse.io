import { Tooltip } from '@mui/material';

import { useGoBackToStep } from 'charmClient/hooks/proposals';
import { Button } from 'components/common/Button';
import { useConfirmationModal } from 'hooks/useConfirmationModal';
import { useSnackbar } from 'hooks/useSnackbar';
import type { PopulatedEvaluation } from 'lib/proposal/interface';

export function ResetPassFailButton({
  evaluation,
  proposalId,
  onSubmit,
  archived,
  hasMovePermission
}: {
  evaluation: PopulatedEvaluation;
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

  const canReset =
    !archived &&
    evaluation?.type === 'pass_fail' &&
    evaluation.result === 'fail' &&
    evaluation.result !== null &&
    (evaluation.isReviewer || hasMovePermission);

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

  if (!canReset) {
    return null;
  }

  return (
    <Tooltip title='Reset evaluation result'>
      <span>
        <Button color='secondary' loading={isSavingEvaluation} size='small' variant='outlined' onClick={onClick}>
          Reset
        </Button>
      </span>
    </Tooltip>
  );
}
