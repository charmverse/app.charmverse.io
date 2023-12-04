import { v4 as uuid } from 'uuid';

import { getDefaultEvaluation, getDefaultFeedbackEvaluation } from './defaultEvaluation';
import type { WorkflowTemplate } from './interfaces';

export const getDefaultWorkflows: (spaceId: string) => WorkflowTemplate[] = (spaceId) => [
  {
    id: uuid(),
    title: 'Community Proposals',
    evaluations: [
      getDefaultFeedbackEvaluation(),
      getDefaultEvaluation({
        title: 'Review',
        type: 'pass_fail'
      }),
      getDefaultEvaluation({
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
      getDefaultFeedbackEvaluation(),
      getDefaultEvaluation({
        title: 'Review',
        type: 'pass_fail'
      }),
      getDefaultEvaluation({
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
      getDefaultFeedbackEvaluation(),
      getDefaultEvaluation({
        title: 'Rubric evaluation',
        type: 'rubric'
      })
    ],
    index: 2,
    spaceId
  }
];
