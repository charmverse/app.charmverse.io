import { ArrowBackIos } from '@mui/icons-material';
import { Typography } from '@mui/material';
import { useState } from 'react';

import { useUpdateProposalEvaluation, useUpdateProposalStatusOnly } from 'charmClient/hooks/proposals';
import { Button } from 'components/common/Button';
import ModalWithButtons from 'components/common/Modal/ModalWithButtons';
import { useSnackbar } from 'hooks/useSnackbar';

import type { ProposalEvaluationValues } from '../../EvaluationSettingsSidebar/components/EvaluationSettings';

export function GoBackButton({
  hasMovePermission,
  isDraft,
  proposalId,
  previousStep,
  onSubmit
}: {
  hasMovePermission: boolean;
  isDraft?: boolean;
  proposalId: string;
  previousStep?: Pick<ProposalEvaluationValues, 'id' | 'type' | 'title'>;
  onSubmit: () => void;
}) {
  const { showMessage } = useSnackbar();
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const { trigger: updateProposalStatusOnly, isMutating: isSavingProposal } = useUpdateProposalStatusOnly({
    proposalId
  });
  const { trigger: updateProposalEvaluation, isMutating: isSavingEvaluation } = useUpdateProposalEvaluation({
    proposalId
  });
  const disabledTooltip = !hasMovePermission
    ? 'You do not have permission to move this proposal'
    : previousStep?.type === 'vote'
    ? 'You cannot go back to a vote'
    : '';

  async function goToPreviousStep() {
    try {
      if (!previousStep) {
        // handle draft, which does not have a evaluation step to go to
        await updateProposalStatusOnly({ newStatus: 'draft' });
      } else {
        await updateProposalEvaluation({ evaluationId: previousStep.id, result: null });
      }
    } catch (error) {
      showMessage((error as Error).message, 'error');
    }
    onSubmit?.();
  }

  function onClick() {
    // no confirmation needed for draft or feedback
    if (!previousStep || previousStep.type === 'feedback') {
      goToPreviousStep();
    } else {
      setShowConfirmation(true);
    }
  }

  function onCancel() {
    setShowConfirmation(false);
  }

  // draft is the first step
  if (isDraft) {
    return <div />;
  }
  return (
    <>
      <Button
        color='secondary'
        loading={isSavingProposal || isSavingEvaluation}
        startIcon={<ArrowBackIos />}
        variant='text'
        disabled={!!disabledTooltip}
        disabledTooltip={disabledTooltip}
        onClick={onClick}
      >
        Back to {previousStep?.title || 'Draft'}
      </Button>
      <ModalWithButtons open={showConfirmation} buttonText='Continue' onClose={onCancel} onConfirm={goToPreviousStep}>
        <Typography>Moving back will clear the result of the previous review and cannot be undone.</Typography>
      </ModalWithButtons>
    </>
  );
}
