import type { ProposalOperation } from '@charmverse/core/prisma';
import type { ProposalWorkflowTyped } from '@charmverse/core/proposals';

export const proposalOperations: ProposalOperation[] = ['view', 'comment', 'edit', 'move'];

export type EvaluationTemplate = ProposalWorkflowTyped['evaluations'][number];
