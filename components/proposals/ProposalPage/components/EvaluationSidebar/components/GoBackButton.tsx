import { Tooltip, Typography } from '@mui/material';
import { useState } from 'react';

import { useClearEvaluationResult, useUpdateProposalStatusOnly } from 'charmClient/hooks/proposals';
import { Button } from 'components/common/Button';
import ModalWithButtons from 'components/common/Modal/ModalWithButtons';
import { useSnackbar } from 'hooks/useSnackbar';

import type { ProposalEvaluationValues } from '../../EvaluationSettingsSidebar/components/EvaluationStepSettings';

export function GoBackButton({
  hasMovePermission,
  proposalId,
  previousStep,
  onSubmit
}: {
  hasMovePermission: boolean;
  proposalId: string;
  previousStep?: Pick<ProposalEvaluationValues, 'id' | 'type' | 'title'>;
  onSubmit: () => void;
}) {
  const { showMessage } = useSnackbar();
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const { trigger: updateProposalStatusOnly, isMutating: isSavingProposal } = useUpdateProposalStatusOnly({
    proposalId
  });
  const { trigger: clearEvaluationResult, isMutating: isSavingEvaluation } = useClearEvaluationResult({
    proposalId
  });
  const disabledTooltip = !hasMovePermission
    ? 'You do not have permission to move this proposal'
    : previousStep?.type === 'vote'
    ? 'You cannot revert the results of a vote'
    : '';

  async function goToPreviousStep() {
    try {
      if (!previousStep) {
        // handle draft, which does not have a evaluation step to go to
        await updateProposalStatusOnly({ newStatus: 'draft' });
      } else {
        await clearEvaluationResult({ evaluationId: previousStep.id });
      }
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
          loading={isSavingProposal || isSavingEvaluation}
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
