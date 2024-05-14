import { log } from '@charmverse/core/log';
import type { Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { ProposalWorkflowTyped, WorkflowEvaluationJson } from '@charmverse/core/proposals';

export async function getWorkflowTemplates(spaceId: string) {
  const dbWorkflows = await prisma.proposalWorkflow.findMany({
    where: {
      spaceId
    }
  });
  return dbWorkflows as ProposalWorkflowTyped[];
}

export async function deleteWorkflowTemplate({ spaceId, workflowId }: { spaceId: string; workflowId: string }) {
  return prisma.proposalWorkflow.delete({
    where: {
      id: workflowId,
      spaceId
    }
  });
}
export async function upsertWorkflowTemplate(workflow: ProposalWorkflowTyped) {
  const originalWorkflow = await prisma.proposalWorkflow.findUnique({
    where: {
      id: workflow.id
    }
  });

  const originalEvaluations = (originalWorkflow ? originalWorkflow.evaluations : []) as WorkflowEvaluationJson[];

  const hasChangedActionButtonLabels = workflow.evaluations.some((evaluation) => {
    const workflowEvaluation = originalEvaluations.find((e) => e.id === evaluation.id);
    if (
      workflowEvaluation?.actionLabels?.approve !== evaluation.actionLabels?.approve ||
      workflowEvaluation?.actionLabels?.reject !== evaluation.actionLabels?.reject
    ) {
      return true;
    }
    return false;
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
            requiredReviews: workflowEvaluation.requiredReviews
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
            requiredReviews: workflowEvaluation.requiredReviews
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

export async function upsertWorkflowActionButtonLabels(workflow: ProposalWorkflowTyped) {
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
