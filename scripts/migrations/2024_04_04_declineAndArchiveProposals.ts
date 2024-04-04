import { getCurrentEvaluation } from '@charmverse/core/proposals';
import { prisma, ProposalEvaluationType } from '@charmverse/core/prisma-client';
import { submitEvaluationResult } from 'lib/proposals/submitEvaluationResult';
import { archiveProposals } from 'lib/proposals/archiveProposals';

const spaceDomain = "grateful-plum-ox";

export async function declineAndArchiveProposals() {
  const allProposals = await prisma.proposal.findMany({
    where: {
      space: {
        domain: spaceDomain
      },
      status: "published",
      // Get the proposals that are in feedback step
      evaluations: {
        some: {
          result: null,
          type: ProposalEvaluationType.feedback
        }
      }
    },
    orderBy: {
      page: {
        createdAt: "asc"
      }
    },
    include: {
      evaluations: true
    }
  });

  // get 1/3 of the proposals each time
  const selectedProposals = allProposals.slice(0, Math.ceil(allProposals.length / 3))

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
  })

  const spaceAdminUserId = spaceAdmin.userId;

  for (const proposal of selectedProposals) {
    const currentEvaluation = getCurrentEvaluation(proposal.evaluations);
    if (currentEvaluation?.type === "feedback") {
      const nextEvaluation = proposal.evaluations[currentEvaluation.index + 1];
      await submitEvaluationResult({
        proposalId: proposal.id,
        evaluationId: currentEvaluation.id,
        result: "pass",
        decidedBy: spaceAdminUserId,
        spaceId: proposal.spaceId
      })

      await submitEvaluationResult({
        proposalId: proposal.id,
        evaluationId: nextEvaluation.id,
        result: "fail",
        decidedBy: spaceAdminUserId,
        spaceId: proposal.spaceId
      })

      await archiveProposals({
        archived: true,
        proposalIds: [proposal.id],
        actorId: spaceAdminUserId
      })
    }
  }
}

declineAndArchiveProposals().then(() => console.log('Done'));
