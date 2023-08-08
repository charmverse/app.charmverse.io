import { ProposalRubricCriteria, ProposalRubricCriteriaType, prisma } from "@charmverse/core/prisma-client";
import { ProposalRubricCriteriaParams, ProposalRubricCriteriaWithTypedParams } from "./interfaces";
import { arrayUtils, objectUtils, stringUtils } from "@charmverse/core/dist/cjs/utilities";
import { InvalidInputError } from "@charmverse/core/dist/cjs/errors";

export type RubricDataInput<T extends ProposalRubricCriteriaType = ProposalRubricCriteriaType> = Pick<ProposalRubricCriteria, 'title'> & ProposalRubricCriteriaParams<T> & Partial<Pick<ProposalRubricCriteria, 'description' | 'id'>>


type RubricUpsert = {
  proposalId: string;
  rubricCriteria: RubricDataInput[]
}

export async function upsertRubric({proposalId, rubricCriteria}: RubricUpsert): Promise<ProposalRubricCriteriaWithTypedParams[]> {
  if (!stringUtils.isUUID(proposalId)) {
    throw new InvalidInputError(`Valid proposalId is required`)
  } else if (!rubricCriteria || !Array.isArray(rubricCriteria)) {
    throw new InvalidInputError(`rubricCriteria are required`)
  }

  for (const criteria of rubricCriteria) {
    if (criteria.type === 'range') {

      const parsedMin = parseInt(criteria.parameters.min as any);
      const parsedMax = parseInt(criteria.parameters.max as any);

      if (Number.isNaN(parsedMin) || Number.isNaN(parsedMax))  {
        throw new InvalidInputError('Minimum and maxium are required for a range type criteria')
      } else if (criteria.parameters.min >= criteria.parameters.max) {
        throw new InvalidInputError(`High end of the range must be greater than low end of the range`)
      }
    } else {
      throw new InvalidInputError(`Unsupported criteria type: ${criteria.type}`)
    }
  }

  const updatedRubrics = await prisma.$transaction(async(tx) => {
    const existingRubrics = await tx.proposalRubricCriteria.findMany({
      where: {
        proposalId
      },
      select: {
        id: true
      }
    });

    // Update existing rubrics
    await rubricCriteria.map(rubric => tx.proposalRubricCriteria.upsert({
      where: {
        id: rubric.id
      },
      create: {
        title: rubric.title,
        description: rubric.description,
        type: rubric.type,
        parameters: rubric.parameters,
        proposal: {connect: {id: proposalId}}        
      },
      update: {
        title: rubric.title,
        description: rubric.description,
        type: rubric.type,
        parameters: rubric.parameters,
      }
    }))


    // Delete invalid rubrics
    await tx.proposalRubricCriteria.deleteMany({
      where: {
        proposalId,
        id: {
          in: []
        }
      }
    })

    // 
  });
}