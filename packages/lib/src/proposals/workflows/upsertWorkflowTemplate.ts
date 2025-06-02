import { InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import type { Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { ProposalWorkflowTyped, WorkflowEvaluationJson } from '@charmverse/core/proposals';
import { getWorkflowLimits } from '@packages/subscriptions/featureRestrictions';

export async function upsertWorkflowTemplate(workflow: ProposalWorkflowTyped) {
  if (!workflow.id) {
    const space = await prisma.space.findUniqueOrThrow({
      where: {
        id: workflow.spaceId
      },
      select: {
        subscriptionTier: true,
        proposalWorkflows: {
          where: {
            archived: false
          },
          select: {
            id: true
          }
        }
      }
    });
    const workflowLimits = getWorkflowLimits(space.subscriptionTier);

    if (space.proposalWorkflows.length >= workflowLimits) {
      throw new InvalidInputError(
        `You have reached the maximum number of workflows (${workflowLimits}) for your subscription tier`
      );
    }
  }

  const originalWorkflow = await prisma.proposalWorkflow.findUnique({
    where: {
      id: workflow.id
    }
  });

  // Double check if the workflow is archived
  if (originalWorkflow?.archived && workflow.archived !== false) {
    throw new InvalidInputError('Cannot modify archived workflows. Unarchive the workflow first.');
  }

  const originalEvaluations = (originalWorkflow ? originalWorkflow.evaluations : []) as WorkflowEvaluationJson[];

  const hasChangedActionButtonLabels = workflow.evaluations.some((evaluation) => {
    const original = originalEvaluations.find((e) => e.id === evaluation.id);
    return (
      original &&
      (original.actionLabels?.approve !== evaluation.actionLabels?.approve ||
        original.actionLabels?.reject !== evaluation.actionLabels?.reject)
    );
  });

  if (hasChangedActionButtonLabels) {
    await upsertWorkflowActionButtonLabels(workflow);
  }

  await prisma.proposalWorkflow.upsert({
    where: {
      id: workflow.id
    },
    create: workflow,
    update: workflow
  });

  // update proposal templates that are using this workflow
  const templates = await prisma.proposal.findMany({
    where: {
      workflowId: workflow.id,
      page: {
        type: 'proposal_template'
      }
    },
    include: {
      evaluations: true
    }
  });
  for (const template of templates) {
    const processedIds: string[] = [];
    for (const workflowEvaluation of workflow.evaluations) {
      const index = workflow.evaluations.indexOf(workflowEvaluation);
      // try to find the original evaluation title by matching evaluation id
      const originalEvaluationTitle = originalEvaluations.find((e) => e.id === workflowEvaluation.id)?.title;
      const originalTemplateEvaluation = template.evaluations.find((e) => e.title === originalEvaluationTitle);
      if (originalTemplateEvaluation) {
        await prisma.proposalEvaluation.update({
          where: {
            id: originalTemplateEvaluation.id
          },
          data: {
            title: workflowEvaluation.title,
            type: workflowEvaluation.type,
            index,
            notificationLabels: workflowEvaluation.notificationLabels as Prisma.InputJsonValue,
            appealable: workflowEvaluation.appealable,
            appealRequiredReviews: workflowEvaluation.appealRequiredReviews,
            finalStep: workflowEvaluation.finalStep,
            requiredReviews: workflowEvaluation.requiredReviews || 1,
            showAuthorResultsOnRubricFail: workflowEvaluation.showAuthorResultsOnRubricFail
          }
        });
        processedIds.push(originalTemplateEvaluation.id);
      } else {
        // add new evaluations from the workflow
        await prisma.proposalEvaluation.create({
          data: {
            proposalId: template.id,
            title: workflowEvaluation.title,
            type: workflowEvaluation.type,
            index,
            notificationLabels: workflowEvaluation.notificationLabels as Prisma.InputJsonValue,
            appealable: workflowEvaluation.appealable,
            appealRequiredReviews: workflowEvaluation.appealRequiredReviews,
            finalStep: workflowEvaluation.finalStep,
            requiredReviews: workflowEvaluation.requiredReviews || 1,
            showAuthorResultsOnRubricFail: workflowEvaluation.showAuthorResultsOnRubricFail
          }
        });
      }
    }
    // remove evaluations that are not in the new workflow
    const evaluationsToDelete = template.evaluations.filter((e) => !processedIds.includes(e.id));
    if (evaluationsToDelete.length) {
      await prisma.proposalEvaluation.deleteMany({
        where: {
          id: {
            in: evaluationsToDelete.map((e) => e.id)
          }
        }
      });
    }
    log.debug('Updated proposal template based on workflow changes', {
      spaceId: workflow.spaceId,
      workflowId: workflow.id,
      pageId: template.id
    });
  }
}

async function upsertWorkflowActionButtonLabels(workflow: ProposalWorkflowTyped) {
  const originalWorkflow = await prisma.proposalWorkflow.findUnique({
    where: {
      id: workflow.id
    },
    select: {
      evaluations: true
    }
  });

  // update proposals & templates that are using this workflow
  const proposals = await prisma.proposal.findMany({
    where: {
      workflowId: workflow.id,
      page: {
        type: {
          in: ['proposal', 'proposal_template']
        }
      }
    },
    select: {
      id: true,
      evaluations: true
    }
  });
  const originalEvaluations = (originalWorkflow ? originalWorkflow.evaluations : []) as WorkflowEvaluationJson[];

  for (const proposal of proposals) {
    for (const workflowEvaluation of workflow.evaluations) {
      const originalEvaluationTitle = originalEvaluations.find((e) => e.id === workflowEvaluation.id)?.title;
      const originalProposalEvaluation = proposal.evaluations.find(
        (e) => e.title === originalEvaluationTitle && e.type === workflowEvaluation.type
      );
      if (originalProposalEvaluation) {
        await prisma.proposalEvaluation.update({
          where: {
            id: originalProposalEvaluation.id
          },
          data: {
            actionLabels: workflowEvaluation.actionLabels as Prisma.InputJsonValue
          }
        });
      }
    }

    log.debug('Updated proposal based on action button label changes', {
      spaceId: workflow.spaceId,
      workflowId: workflow.id,
      pageId: proposal.id
    });
  }
}
