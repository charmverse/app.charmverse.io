import type { ProposalRubricCriteria, ProposalRubricCriteriaType } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { InvalidInputError } from '@packages/core/errors';
import { stringUtils } from '@packages/core/utilities';
import { v4 as uuid } from 'uuid';

import { setPageUpdatedAt } from '../setPageUpdatedAt';

import type { RubricCriteriaTypedFields, RubricCriteriaTyped } from './interfaces';

export type RubricDataInput = Pick<ProposalRubricCriteria, 'title'> &
  Partial<Pick<ProposalRubricCriteria, 'description' | 'id' | 'index'>> &
  RubricCriteriaTypedFields;

export type RubricCriteriaUpsert = {
  proposalId: string;
  evaluationId: string;
  rubricCriteria: RubricDataInput[];
};

export async function upsertRubricCriteria({
  proposalId,
  evaluationId,
  rubricCriteria,
  actorId
}: RubricCriteriaUpsert & { actorId: string }): Promise<RubricCriteriaTyped[]> {
  if (!stringUtils.isUUID(proposalId)) {
    throw new InvalidInputError(`Valid proposalId is required`);
  } else if (!rubricCriteria || !Array.isArray(rubricCriteria)) {
    throw new InvalidInputError(`rubricCriteria are required`);
  }

  const existingCriteria = await prisma.proposalRubricCriteria.findMany({
    where: {
      proposalId,
      evaluationId
    },
    select: {
      id: true
    }
  });

  for (const criteria of rubricCriteria) {
    if (criteria.type === 'range') {
      const parsedMin = parseInt(criteria.parameters.min as any);
      const parsedMax = parseInt(criteria.parameters.max as any);

      if (Number.isNaN(parsedMin) || Number.isNaN(parsedMax)) {
        throw new InvalidInputError('Minimum and maxium are required for a range type criteria');
      } else if (criteria.parameters.min >= criteria.parameters.max) {
        throw new InvalidInputError(`High end of the range must be greater than low end of the range`);
      }
    } else {
      throw new InvalidInputError(`Unsupported criteria type: ${criteria.type}`);
    }
  }

  const updatedCriteria = await prisma.$transaction(async (tx) => {
    // Delete invalid rubrics
    if (existingCriteria.length > 0) {
      await tx.proposalRubricCriteria.deleteMany({
        where: {
          proposalId,
          id: {
            in: existingCriteria
              .filter((c) => !rubricCriteria.some((newCriteria) => newCriteria.id === c.id))
              .map((c) => c.id)
          }
        }
      });
    }

    // Update existing rubrics
    await Promise.all(
      rubricCriteria.map((rubric, index) => {
        // Don't use the ID if this is not already a criteria for this proposal
        const rubricCriteriaId = rubric.id && existingCriteria.some((c) => c.id === rubric.id) ? rubric.id : uuid();
        return tx.proposalRubricCriteria.upsert({
          where: {
            id: rubricCriteriaId
          },
          create: {
            id: rubricCriteriaId,
            index: typeof rubric.index === 'number' && rubric.index !== -1 ? rubric.index : index,
            title: rubric.title,
            description: rubric.description,
            type: rubric.type,
            parameters: rubric.parameters,
            proposalId,
            evaluationId
          },
          update: {
            title: rubric.title,
            description: rubric.description,
            index: rubric.index || index,
            type: rubric.type,
            parameters: rubric.parameters
          }
        });
      })
    );

    return tx.proposalRubricCriteria.findMany({
      where: {
        proposalId,
        evaluationId
      },
      orderBy: {
        index: 'asc'
      }
    });
  });

  await setPageUpdatedAt({ proposalId, userId: actorId });

  return updatedCriteria as RubricCriteriaTyped[];
}
