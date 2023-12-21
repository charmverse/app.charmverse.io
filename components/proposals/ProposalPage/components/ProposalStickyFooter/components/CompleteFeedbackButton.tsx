import { ArrowForwardIos } from '@mui/icons-material';

import { useUpdateProposalEvaluation } from 'charmClient/hooks/proposals';
import { Button } from 'components/common/Button';
import { useSnackbar } from 'hooks/useSnackbar';

export type Props = {
  proposalId: string;
  currentStep?: { id: string; title: string };
  hasMovePermission: boolean;
  nextStep?: { title: string };
  onSubmit?: VoidFunction;
};

export function CompleteFeedbackButton({ proposalId, hasMovePermission, currentStep, nextStep, onSubmit }: Props) {
  const { showMessage } = useSnackbar();
  const { trigger: updateProposalEvaluation, isMutating } = useUpdateProposalEvaluation({ proposalId });

  const disabledTooltip = !hasMovePermission ? 'You do not have permission to move this proposal' : undefined;

  async function onMoveForward() {
    try {
      await updateProposalEvaluation({
        evaluationId: currentStep?.id,
        result: 'pass'
      });
    } catch (error) {
      showMessage((error as Error).message, 'error');
    }
    onSubmit?.();
  }

  return (
    <Button
      endIcon={<ArrowForwardIos />}
      loading={isMutating}
      onClick={onMoveForward}
      disabled={!!disabledTooltip}
      disabledTooltip={disabledTooltip}
    >
      {nextStep ? `Move to ${nextStep.title}` : `Complete ${currentStep?.title}`}
    </Button>
  );
}
