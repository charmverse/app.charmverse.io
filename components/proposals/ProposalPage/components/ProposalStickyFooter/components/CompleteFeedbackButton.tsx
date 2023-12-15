import { useUpdateProposalEvaluation } from 'charmClient/hooks/proposals';
import { Button } from 'components/common/Button';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import type { ProposalWithUsersAndRubric, PopulatedEvaluation } from 'lib/proposal/interface';

export type Props = {
  proposal?: Pick<ProposalWithUsersAndRubric, 'id' | 'authors' | 'evaluations' | 'status' | 'evaluationType'>;
  evaluationId?: string;
  refreshProposal?: VoidFunction;
};

export function CompleteFeedbackButton({ proposal, evaluationId, refreshProposal }: Props) {
  const isAdmin = useIsAdmin();
  const { user } = useUser();
  const { showMessage } = useSnackbar();
  const { trigger: updateProposalEvaluation, isMutating } = useUpdateProposalEvaluation({ proposalId: proposal?.id });

  const currentEvaluationIndex = proposal?.evaluations.findIndex((e) => e.id === evaluationId) ?? -1;

  const nextEvaluation = proposal?.evaluations[currentEvaluationIndex + 1];
  const isMover = isAdmin || proposal?.authors.some((author) => author.userId === user?.id);
  const disabledTooltip = !isMover ? 'You do not have permission to move this evaluation' : null;
  async function onMoveForward() {
    try {
      await updateProposalEvaluation({
        evaluationId,
        result: 'pass'
      });
    } catch (error) {
      showMessage((error as Error).message, 'error');
    }
    refreshProposal?.();
  }

  return (
    <Button loading={isMutating} onClick={onMoveForward} disabled={!!disabledTooltip} disabledTooltip={disabledTooltip}>
      Move to {nextEvaluation?.title}
    </Button>
  );
}
