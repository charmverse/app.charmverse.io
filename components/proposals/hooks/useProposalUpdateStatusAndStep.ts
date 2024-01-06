import type { ProposalEvaluationResult } from '@charmverse/core/prisma-client';
import { mutate } from 'swr';

import charmClient from 'charmClient';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';
import type { ProposalEvaluationStep } from 'lib/proposal/interface';

export function useProposalUpdateStatusAndStep() {
  const { space } = useCurrentSpace();
  const { showMessage } = useSnackbar();

  async function updateProposalStatus({
    proposalData,
    result,
    currentEvaluationStep
  }: {
    proposalData: { proposalId: string; evaluationId?: string | null };
    currentEvaluationStep: ProposalEvaluationStep;
    result: ProposalEvaluationResult;
  }) {
    const { proposalId, evaluationId } = proposalData;
    if (currentEvaluationStep === 'rewards' && result === 'pass') {
      await charmClient.proposals.createProposalRewards({
        proposalId
      });
    } else if (currentEvaluationStep === 'draft' && result === 'pass') {
      await charmClient.proposals.updateProposalStatusOnly({
        proposalId,
        newStatus: 'published'
      });
    } else if (evaluationId) {
      await charmClient.proposals.submitEvaluationResult({
        proposalId,
        evaluationId,
        result
      });
    }
  }

  async function batchUpdateProposalStatuses({
    proposalsData,
    result,
    currentEvaluationStep
  }: {
    proposalsData: { proposalId: string; evaluationId?: string | null }[];
    currentEvaluationStep: ProposalEvaluationStep;
    result: ProposalEvaluationResult;
  }) {
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

  async function batchUpdateProposalSteps(
    proposalsData: { evaluationId: string; proposalId: string; currentEvaluationStep: ProposalEvaluationStep }[],
    moveForward: boolean
  ) {
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
          } else if (evaluationId !== 'draft') {
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
    batchUpdateProposalStatuses,
    batchUpdateProposalSteps
  };
}
