import { Prisma, prisma } from '@charmverse/core/prisma-client';

/**
 * Use this script to perform database searches.
 */

async function duplicateRubricCriterias() {
  const sourceProposalTemplateId = "9a90cb1e-44e9-407e-81e9-7fe252e9ad74";
  const destinationProposalTemplateIds = [
    "e3edf64f-c6e0-4958-93ca-a3775d1ffab1"
  ]

  const proposalTemplate = await prisma.proposal.findFirstOrThrow({
    where: {
      page: {
        id: sourceProposalTemplateId
      }
    },
    select: {
      rubricCriteria: true
    }
  })

  for (const templateId of destinationProposalTemplateIds) {
    try {
      const rubricEvaluation = await prisma.proposalEvaluation.findFirstOrThrow({
        where: {
          proposal: {
            page: {
              id: templateId
            },
          },
          type: "rubric",
          title: "Rubric"
        }
      })
  
      await prisma.$transaction([
        prisma.proposalRubricCriteria.deleteMany({
          where: {
            proposalId: templateId,
            evaluationId: rubricEvaluation.id
          }
        }),
        ...proposalTemplate.rubricCriteria.map(criteria => prisma.proposalRubricCriteria.create({
          data: {
            proposalId: templateId,
            evaluationId: rubricEvaluation.id,
            parameters: criteria.parameters as any,
            title: criteria.title,
            type: criteria.type,
            description: criteria.description,
            index: criteria.index
          }
        }))
      ])
    } catch (_) {
      console.log(`Failed to update rubric for proposal template ${templateId}`)
    }
  }
}

duplicateRubricCriterias().then(() => console.log('Done'));
