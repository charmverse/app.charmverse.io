import { prisma } from '@charmverse/core/prisma-client';
import { getWorkflowLimits } from '@packages/subscriptions/featureRestrictions';
import { DataNotFoundError, InvalidInputError, UndesirableOperationError } from '@packages/utils/errors';

interface UnarchiveWorkflowTemplateInput {
  workflowId: string;
  spaceId: string;
}

export async function unarchiveWorkflowTemplate({ workflowId, spaceId }: UnarchiveWorkflowTemplateInput) {
  const workflow = await prisma.proposalWorkflow.findUnique({
    where: {
      id: workflowId
    },
    select: {
      id: true,
      spaceId: true,
      archived: true
    }
  });

  if (!workflow) {
    throw new DataNotFoundError(`Workflow template with id ${workflowId} not found`);
  }

  if (!workflow.archived) {
    throw new InvalidInputError('Workflow template is not archived');
  }

  if (workflow.spaceId !== spaceId) {
    throw new InvalidInputError('Workflow template does not belong to this space');
  }

  // Get space details to check tier
  const space = await prisma.space.findUniqueOrThrow({
    where: {
      id: spaceId
    },
    select: {
      subscriptionTier: true
    }
  });

  // Get current active workflows count
  const activeWorkflowsCount = await prisma.proposalWorkflow.count({
    where: {
      spaceId,
      archived: false
    }
  });

  // Get max workflows allowed for this tier
  const maxWorkflows = getWorkflowLimits(space.subscriptionTier);

  // Check if unarchiving would exceed the limit
  if (activeWorkflowsCount >= maxWorkflows) {
    throw new UndesirableOperationError(
      `Cannot unarchive workflow template. You have reached the maximum number of workflows (${maxWorkflows}) for your plan.`
    );
  }

  const updatedWorkflow = await prisma.proposalWorkflow.update({
    where: {
      id: workflowId
    },
    data: {
      archived: false
    }
  });

  return updatedWorkflow;
}
