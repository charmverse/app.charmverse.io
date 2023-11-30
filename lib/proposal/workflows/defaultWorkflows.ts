import { v4 as uuid } from 'uuid';

import type { WorkflowTemplate } from './interfaces';

export const getDefaultWorkflows: (spaceId: string) => WorkflowTemplate[] = (spaceId) => [
  {
    id: uuid(),
    title: 'Community Proposals',
    evaluations: [
      {
        id: uuid(),
        title: 'Review',
        type: 'pass_fail',
        permissions: []
      },
      {
        id: uuid(),
        title: 'Community vote',
        type: 'vote',
        permissions: []
      }
    ],
    index: 0,
    spaceId
  },
  {
    id: uuid(),
    title: 'Decision Matrix',
    evaluations: [
      {
        id: uuid(),
        title: 'Review',
        type: 'pass_fail',
        permissions: []
      },
      {
        id: uuid(),
        title: 'Rubric evaluation',
        type: 'rubric',
        permissions: []
      }
    ],
    index: 1,
    spaceId
  },
  {
    id: uuid(),
    title: 'Grant Applications',
    evaluations: [
      {
        id: uuid(),
        title: 'Rubric evaluation',
        type: 'rubric',
        permissions: []
      }
    ],
    index: 2,
    spaceId
  }
];
