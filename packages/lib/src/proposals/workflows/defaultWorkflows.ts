import type { ProposalWorkflowTyped } from '@charmverse/core/proposals';
import { v4 as uuid } from 'uuid';

import { getDefaultEvaluation, getDefaultFeedbackEvaluation } from './defaultEvaluation';

export const defaultWorkflowTitle = 'Community Proposals';
export const decisionMatrixWorkflowTitle = 'Decision Matrix';
export const grantApplicationsWorkflowTitle = 'Grant Applications';

export const getDefaultWorkflows: (spaceId: string) => ProposalWorkflowTyped[] = (spaceId) => [
  {
    id: uuid(),
    createdAt: new Date(),
    title: defaultWorkflowTitle,
    privateEvaluations: false,
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
    spaceId,
    draftReminder: false,
    archived: false
  },
  {
    id: uuid(),
    createdAt: new Date(),
    title: decisionMatrixWorkflowTitle,
    privateEvaluations: false,
    evaluations: [
      getDefaultEvaluation({
        title: 'Feedback',
        type: 'feedback'
      }),
      getDefaultEvaluation({
        title: 'Rubric evaluation',
        type: 'rubric'
      })
    ],
    index: 1,
    spaceId,
    draftReminder: false,
    archived: false
  },
  {
    id: uuid(),
    createdAt: new Date(),
    title: grantApplicationsWorkflowTitle,
    privateEvaluations: false,
    evaluations: [
      getDefaultEvaluation({
        title: 'Rubric evaluation',
        type: 'rubric'
      })
    ],
    index: 2,
    spaceId,
    draftReminder: false,
    archived: false
  }
];
