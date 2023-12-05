import type { ProposalOperation } from '@charmverse/core/prisma';
import type { ProposalWorkflowTyped } from '@charmverse/core/proposals';

export type EvaluationTemplate = ProposalWorkflowTyped['evaluations'][number];
