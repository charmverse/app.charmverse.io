import { mutate } from 'swr';

import charmClient from 'charmClient';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import type { ProposalEvaluationStatus, ProposalEvaluationStep } from 'lib/proposal/interface';

export function useProposalUpdateStatusAndStep() {
  const { space } = useCurrentSpace();
  const { showMessage } = useSnackbar();
  const { user: currentUser } = useUser();

  async function updateProposalStatus({
    proposalsData,
    status,
    currentEvaluationStep
  }: {
    proposalsData: { proposalId: string; evaluationId?: string | null }[];
    currentEvaluationStep: ProposalEvaluationStep;
    status: ProposalEvaluationStatus;
  }) {
    if (space && currentUser) {
      const { id: spaceId } = space;
      try {
        for (const { proposalId, evaluationId } of proposalsData) {
          if (currentEvaluationStep === 'rewards') {
            await charmClient.proposals.createProposalRewards({
              proposalId
            });
          } else if (currentEvaluationStep === 'draft' && status === 'published') {
            await charmClient.proposals.updateProposalStatusOnly({
              proposalId,
              newStatus: 'published'
            });
          } else if (evaluationId) {
            await charmClient.proposals.submitEvaluationResult({
              proposalId,
              evaluationId,
              decidedBy: currentUser.id,
              result: status === 'complete' || status === 'passed' ? 'pass' : 'fail'
            });
          }
        }
        await mutate(`/api/spaces/${spaceId}/proposals`);
      } catch (err: any) {
        showMessage(err.message, 'error');
      }
    }
  }

  async function updateProposalStep(proposalsData: { evaluationId: string; proposalId: string }[]) {
    if (space) {
      const { id: spaceId } = space;
      try {
        for (const { evaluationId, proposalId } of proposalsData) {
          if (evaluationId !== 'draft') {
            await charmClient.proposals.goBackToEvaluationStep({
              evaluationId,
              proposalId
            });
          } else {
            await charmClient.proposals.updateProposalStatusOnly({
              newStatus: 'draft',
              proposalId
            });
          }
        }
        await mutate(`/api/spaces/${spaceId}/proposals`);
      } catch (err: any) {
        showMessage(err.message, 'error');
      }
    }
  }

  return {
    updateProposalStep,
    updateProposalStatus
  };
}
