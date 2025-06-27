import { prisma } from '@charmverse/core/prisma-client';
import type { ProposalWorkflowTyped } from '@packages/core/proposals';

export async function getWorkflowTemplates(spaceId: string) {
  const dbWorkflows = await prisma.proposalWorkflow.findMany({
    where: {
      spaceId
    }
  });
  return dbWorkflows as ProposalWorkflowTyped[];
}
