import type { PageType, Prisma, ProposalEvaluationType } from '@charmverse/core/prisma-client';
import type { WorkflowEvaluationJson } from '@packages/core/proposals';

import type { VoteSettings } from './interfaces';

export async function getVoteEvaluationStepsWithBlockNumber<
  E extends {
    type: ProposalEvaluationType;
    id: string;
    voteSettings?: Prisma.JsonValue;
    actionLabels?: WorkflowEvaluationJson['actionLabels'] | Prisma.JsonValue;
  }
>({ evaluations, pageType, isDraft }: { isDraft: boolean; evaluations: E[]; pageType?: PageType }): Promise<E[]> {
  if (isDraft || !pageType || pageType !== 'proposal') {
    return evaluations;
  }

  const tokenVoteSteps = evaluations
    .filter(
      (evaluation) =>
        evaluation.type === 'vote' &&
        (evaluation.voteSettings as VoteSettings)?.strategy === 'token' &&
        (evaluation.voteSettings as VoteSettings)?.chainId
    )
    .map((evaluation) => ({
      voteStepId: evaluation.id,
      chainId: (evaluation.voteSettings as VoteSettings).chainId as number
    }));

  if (tokenVoteSteps.length === 0) {
    return evaluations;
  }

  const snapshot = (await import('@snapshot-labs/snapshot.js')).default;
  const blockNumbers = await Promise.all(
    tokenVoteSteps.map(async (tokenVoteStep) => {
      const provider = await snapshot.utils.getProvider(tokenVoteStep.chainId);
      const blockNumber = (await provider.getBlockNumber()) as number;
      return {
        blockNumber,
        voteStepId: tokenVoteStep.voteStepId
      };
    })
  );

  return evaluations.map((evaluation) => {
    const hasBlockNumber = blockNumbers.find((blockNumber) => blockNumber.voteStepId === evaluation.id);
    if (hasBlockNumber) {
      return {
        ...evaluation,
        voteSettings: {
          ...((evaluation.voteSettings as VoteSettings) ?? {}),
          blockNumber: hasBlockNumber.blockNumber.toString()
        }
      };
    }

    return evaluation;
  });
}
