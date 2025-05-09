// @ts-nocheck
import { getCurrentEvaluation } from '@charmverse/core/proposals';
import { prisma } from '@charmverse/core/prisma-client';
import { submitEvaluationResult } from '@packages/lib/proposals/submitEvaluationResult';
import { archiveProposals } from '@packages/lib/proposals/archiveProposals';

const spaceDomain = 'classic-orange-dingo';

export async function declineAndArchiveProposals() {
  const allProposals = await prisma.proposal.findMany({
    where: {
      space: {
        domain: spaceDomain
      },
      page: {
        type: 'proposal'
      }
    },
    orderBy: {
      page: {
        createdAt: 'asc'
      }
    },
    include: {
      evaluations: {
        orderBy: {
          index: 'asc'
        }
      }
    }
  });

  let iteration = 1;
  const proposalsPerIteration = Math.ceil(allProposals.length / 3);
  const start = iteration * proposalsPerIteration;
  const end = (iteration + 1) * proposalsPerIteration;
  const selectedProposals = allProposals.slice(start, end).filter((proposal) => !proposal.archived);

  const spaceAdmin = await prisma.spaceRole.findFirstOrThrow({
    where: {
      space: {
        domain: spaceDomain
      },
      isAdmin: true
    },
    select: {
      userId: true
    }
  });

  const spaceAdminUserId = spaceAdmin.userId;

  for (const proposal of selectedProposals) {
    const currentEvaluation = getCurrentEvaluation(proposal.evaluations);
    let rubricEvaluationId: null | string = null;
    if (currentEvaluation?.type === 'feedback') {
      await submitEvaluationResult({
        proposalId: proposal.id,
        evaluationId: currentEvaluation.id,
        result: 'pass',
        decidedBy: spaceAdminUserId,
        spaceId: proposal.spaceId
      });

      rubricEvaluationId = proposal.evaluations[currentEvaluation.index + 1]?.id;
    }
    // Skip the rubric evaluation if it has failed or passed
    else if (currentEvaluation?.type === 'rubric' && currentEvaluation.result === null) {
      rubricEvaluationId = currentEvaluation.id;
    }

    if (rubricEvaluationId) {
      await submitEvaluationResult({
        proposalId: proposal.id,
        evaluationId: rubricEvaluationId,
        result: 'fail',
        decidedBy: spaceAdminUserId,
        spaceId: proposal.spaceId
      });
    }
  }

  await archiveProposals({
    archived: true,
    proposalIds: selectedProposals.map((selectedProposal) => selectedProposal.id),
    actorId: spaceAdminUserId
  });
}

declineAndArchiveProposals().then(() => console.log('Done'));
