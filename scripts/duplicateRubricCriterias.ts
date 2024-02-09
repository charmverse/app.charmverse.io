import { Prisma, prisma } from '@charmverse/core/prisma-client';

/**
 * Use this script to perform database searches.
 */

async function duplicateRubricCriterias() {
  const sourceProposalTemplateId = "9a90cb1e-44e9-407e-81e9-8fe252e9ad74";
  const destinationProposalTemplateIds = [
    "e3edf64f-c6e0-4958-93ca-a3775d1ffab2",
    "976f70f3-94c8-4526-987e-55fc18071b6a",
    "8b2a4b4d-2f8e-4ece-aa34-5625b484a4b9",
    "4e261347-dc04-49b7-979e-df9b936d882c"
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
          proposalId: templateId,
          type: "rubric",
          title: "Preliminary and Final review"
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
