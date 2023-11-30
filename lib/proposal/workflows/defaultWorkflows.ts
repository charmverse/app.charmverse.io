import { v4 as uuid } from 'uuid';

import { getDefaultEvaluationStep } from './defaultEvaluationStep';
import type { WorkflowTemplate } from './interfaces';

export const getDefaultWorkflows: (spaceId: string) => WorkflowTemplate[] = (spaceId) => [
  {
    id: uuid(),
    title: 'Community Proposals',
    evaluations: [
      getDefaultEvaluationStep({
        title: 'Review',
        type: 'pass_fail'
      }),
      getDefaultEvaluationStep({
        title: 'Community vote',
        type: 'vote'
      })
    ],
    index: 0,
    spaceId
  },
  {
    id: uuid(),
    title: 'Decision Matrix',
    evaluations: [
      getDefaultEvaluationStep({
        title: 'Review',
        type: 'pass_fail'
      }),
      getDefaultEvaluationStep({
        title: 'Rubric evaluation',
        type: 'rubric'
      })
    ],
    index: 1,
    spaceId
  },
  {
    id: uuid(),
    title: 'Grant Applications',
    evaluations: [
      getDefaultEvaluationStep({
        title: 'Rubric evaluation',
        type: 'rubric'
      })
    ],
    index: 2,
    spaceId
  }
];
