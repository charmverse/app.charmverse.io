import { usePublishProposalStatus } from 'charmClient/hooks/proposals';
import { Button } from 'components/common/Button';
import { useSnackbar } from 'hooks/useSnackbar';
import type { ProposalWithUsersAndRubric } from 'lib/proposal/interface';

export type Props = {
  proposal?: Pick<ProposalWithUsersAndRubric, 'id' | 'authors' | 'evaluations' | 'status' | 'evaluationType'>;
  refreshProposal?: VoidFunction;
};

export function PublishDraftButton({ proposal, refreshProposal }: Props) {
  const { showMessage } = useSnackbar();
  const { trigger: updateProposalStatus, isMutating } = usePublishProposalStatus({ proposalId: proposal?.id });

  const nextEvaluation = proposal?.evaluations[0];

  async function onClick() {
    try {
      await updateProposalStatus({ newStatus: 'published' });
    } catch (error) {
      showMessage((error as Error).message, 'error');
    }
    refreshProposal?.();
  }

  return (
    <Button loading={isMutating} onClick={onClick}>
      Move to {nextEvaluation?.title}
    </Button>
  );
}
