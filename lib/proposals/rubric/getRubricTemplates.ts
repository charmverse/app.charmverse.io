import { prisma } from '@charmverse/core/prisma-client';

import type { RubricCriteriaTyped } from './interfaces';

export type RubricTemplate = {
  pageTitle: string;
  evaluationTitle: string;
  rubricCriteria: RubricCriteriaTyped[];
};

export async function getRubricTemplates({
  excludeEvaluationId,
  spaceId
}: {
  excludeEvaluationId: string;
  spaceId: string;
}): Promise<RubricTemplate[]> {
  const evaluations = await prisma.proposalEvaluation.findMany({
    where: {
      id: {
        not: excludeEvaluationId
      },
      type: 'rubric',
      proposal: {
        page: {
          spaceId,
          type: 'proposal_template'
        }
      }
    },
    include: {
      rubricCriteria: {
        orderBy: { index: 'asc' }
      },
      proposal: {
        select: {
          page: {
            select: {
              title: true
            }
          }
        }
      }
    }
  });
  return evaluations
    .map(({ rubricCriteria, proposal, title }) => {
      return {
        pageTitle: proposal.page?.title || '',
        evaluationTitle: title,
        rubricCriteria: rubricCriteria as RubricCriteriaTyped[]
      };
    })
    .sort((a, b) => a.pageTitle.localeCompare(b.pageTitle));
}
