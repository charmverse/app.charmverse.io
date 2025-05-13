import type { ProposalEvaluationResult } from '@charmverse/core/prisma-client';
import { mutate } from 'swr';

import charmClient from 'charmClient';
import { useConfirmationModal } from 'hooks/useConfirmationModal';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';
import type { ProposalEvaluationStep } from '@packages/lib/proposals/interfaces';

export function useBatchUpdateProposalStatusOrStep() {
  const { space } = useCurrentSpace();
  const { showConfirmation } = useConfirmationModal();
  const { showMessage } = useSnackbar();

  async function updateProposalStatus({
    proposalData,
    result,
    currentEvaluationStep
  }: {
    proposalData: { proposalId: string; evaluationId?: string | null };
    currentEvaluationStep: ProposalEvaluationStep;
    result: ProposalEvaluationResult | null;
  }) {
    const { proposalId, evaluationId } = proposalData;
    if (currentEvaluationStep === 'rewards' && result === 'pass') {
      await charmClient.proposals.createProposalRewards({
        proposalId
      });
    } else if (currentEvaluationStep === 'draft' && result === 'pass') {
      await charmClient.proposals.publishProposal(proposalId);
    } else if (evaluationId) {
      // Unset the result of the current evaluation step, when In progress status is selected,
      // the evaluationId is the current evaluation id,
      // technically its not going back to the previous step, but only the result is being unset
      if (result === null) {
        await charmClient.proposals.goBackToStep({
          proposalId,
          evaluationId
        });
      } else {
        await charmClient.proposals.submitEvaluationResult({
          proposalId,
          evaluationId,
          result
        });
      }
    }
  }

  async function updateStatuses({
    proposalsData,
    result,
    currentEvaluationStep
  }: {
    proposalsData: { proposalId: string; evaluationId?: string | null }[];
    currentEvaluationStep: ProposalEvaluationStep;
    result: ProposalEvaluationResult | null;
  }) {
    const { confirmed } = await showConfirmation({
      message: result
        ? `${result === 'pass' ? 'Approve' : 'Decline'} current evaluation${proposalsData.length > 1 ? 's' : ''}?`
        : 'Revert evaluation results?'
    });
    if (!confirmed) {
      return;
    }
    if (space) {
      const { id: spaceId } = space;
      try {
        for (const proposalData of proposalsData) {
          await updateProposalStatus({
            currentEvaluationStep,
            proposalData,
            result
          });
        }
        await mutate(`/api/spaces/${spaceId}/proposals`);
      } catch (err: any) {
        showMessage(err.message, 'error');
      }
    }
  }

  async function updateSteps(
    proposalsData: { evaluationId?: string; proposalId: string; currentEvaluationStep: ProposalEvaluationStep }[],
    moveForward: boolean
  ) {
    const { confirmed } = await showConfirmation({
      message: moveForward
        ? `Approve current evaluation${proposalsData.length > 1 ? 's' : ''}?`
        : 'Moving back will clear the result of the current and previous steps and cannot be undone.'
    });
    if (!confirmed) {
      return;
    }
    if (space) {
      const { id: spaceId } = space;
      try {
        for (const { currentEvaluationStep, evaluationId, proposalId } of proposalsData) {
          if (moveForward) {
            await updateProposalStatus({
              proposalData: { proposalId, evaluationId },
              currentEvaluationStep,
              result: 'pass'
            });
          } else {
            await charmClient.proposals.goBackToStep({
              evaluationId,
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
    updateStatuses,
    updateSteps
  };
}
