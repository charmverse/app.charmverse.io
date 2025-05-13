import { Prisma, prisma } from '@charmverse/core/prisma-client';

/**
 * Copies the rubric criteria from one proposal to another. Assume that the target proposals have one single rubric evaluation step.
 */

const sourceProposalId = '39b00943-3b34-4b57-aad6-5e73830d132a';
const destinationProposals = [
  // '13ab5123-9093-427f-ae00-d2f34752234c'
  'b6ff8a9d-3bf2-4f33-b233-f06d4eb6ac09',
  '747ce494-ee2d-421c-8acd-0f8daaa966a7',
  'c9297a9c-50c4-461d-9888-248df076eb69',
  'd2ca63af-bd94-4627-a2fe-d2e3517a07d6',
  '216d096a-0c02-453d-8fe1-62676d941e10'
];

async function duplicateRubricCriterias() {
  const sourceProposal = await prisma.proposal.findFirstOrThrow({
    where: {
      page: {
        id: sourceProposalId
      }
    },
    select: {
      evaluations: true,
      rubricCriteria: true
    }
  });

  for (const proposalIdToUpdate of destinationProposals) {
    try {
      const rubricEvaluations = await prisma.proposalEvaluation.findMany({
        where: {
          proposalId: proposalIdToUpdate,
          type: 'rubric'
          // title: rubricEvaluationTitle
        }
      });
      if (rubricEvaluations.length !== 1) {
        throw new Error(
          'Could not determine which evaluation step to override: ' +
            (rubricEvaluations.map((e) => e.title) || '(none found)')
        );
      }
      const rubricEvaluation = rubricEvaluations[0];

      await prisma.$transaction([
        prisma.proposalRubricCriteria.deleteMany({
          where: {
            proposalId: rubricEvaluation.proposalId,
            evaluationId: rubricEvaluation.id
          }
        }),
        ...sourceProposal.rubricCriteria.map(({ id, evaluationId, proposalId, ...criteria }) =>
          prisma.proposalRubricCriteria.create({
            data: {
              ...criteria,
              parameters: criteria.parameters as any,
              proposalId: rubricEvaluation.proposalId,
              evaluationId: rubricEvaluation.id
            }
          })
        )
      ]);
      console.log('Updated proposal:', proposalIdToUpdate);
    } catch (_) {
      console.log(`Failed to update rubric for proposal template ${proposalIdToUpdate}`, _);
    }
  }
}

duplicateRubricCriterias().then(() => console.log('Done'));
