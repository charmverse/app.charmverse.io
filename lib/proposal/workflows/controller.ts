import { log } from '@charmverse/core/log';
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
  const originalEvaluations = (originalWorkflow ? originalWorkflow.evaluations : []) as WorkflowEvaluationJson[];
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
            index
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
            index
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
