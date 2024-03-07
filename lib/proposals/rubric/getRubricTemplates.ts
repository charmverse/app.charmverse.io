import { prisma } from '@charmverse/core/prisma-client';

import type { RubricCriteriaTyped } from './interfaces';

export type RubricTemplate = {
  pageTitle: string;
  evaluationTitle: string;
  rubricCriteria: RubricCriteriaTyped[];
};

export async function getRubricTemplates({ spaceId }: { spaceId: string }): Promise<RubricTemplate[]> {
  const proposals = await prisma.page.findMany({
    where: {
      spaceId,
      type: 'proposal_template'
    },
    include: {
      proposal: {
        include: {
          evaluations: {
            include: {
              rubricCriteria: true
            },
            orderBy: { index: 'asc' }
          }
        }
      }
    }
  });
  return proposals.flatMap((p) => {
    return (p.proposal?.evaluations || [])
      .filter((e) => e.type === 'rubric')
      .map((e) => {
        return {
          pageTitle: p.title,
          evaluationTitle: e.title,
          rubricCriteria: e.rubricCriteria as RubricCriteriaTyped[]
        };
      });
  });
}
