import { Tooltip, Typography } from '@mui/material';
import { useState } from 'react';

import { useGoBackToStep } from 'charmClient/hooks/proposals';
import { Button } from 'components/common/Button';
import ModalWithButtons from 'components/common/Modal/ModalWithButtons';
import { useSnackbar } from 'hooks/useSnackbar';

import type { ProposalEvaluationValues } from '../../EvaluationSettingsSidebar/components/EvaluationStepSettings';

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
  const { showMessage } = useSnackbar();
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
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

  function onClick() {
    // no confirmation needed for draft or feedback
    if (!previousStep) {
      goToPreviousStep();
    } else {
      setShowConfirmation(true);
    }
  }

  function onCancel() {
    setShowConfirmation(false);
  }

  return (
    <>
      <Tooltip title={`Move back to ${previousStep?.title || 'Draft'}`}>
        <Button
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
      </Tooltip>
      <ModalWithButtons open={showConfirmation} buttonText='Continue' onClose={onCancel} onConfirm={goToPreviousStep}>
        <Typography>
          Moving back will clear the result of the current and previous steps and cannot be undone.
        </Typography>
      </ModalWithButtons>
    </>
  );
}
