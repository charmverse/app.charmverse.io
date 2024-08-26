import { InvalidInputError } from '@charmverse/core/errors';
import type { Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { ProposalWorkflowTyped } from '@charmverse/core/proposals';
import { lowerCaseEqual } from '@root/lib/utils/strings';

export async function syncProposalPermissionsWithWorkflowPermissions({
  proposalId,
  evaluationIds
}: {
  proposalId: string;
  evaluationIds?: string[];
}): Promise<void> {
  const proposalWithEvaluations = await prisma.proposal.findUniqueOrThrow({
    where: {
      id: proposalId
    },
    include: {
      workflow: true,
      evaluations: {
        orderBy: {
          index: 'asc'
        }
      }
    }
  });

  if (!proposalWithEvaluations.workflow) {
    throw new InvalidInputError(`Proposal does not have a workflow`);
  }

  const workflow = proposalWithEvaluations.workflow as ProposalWorkflowTyped;

  const workflowEvaluations = workflow.evaluations;

  if (proposalWithEvaluations.workflowId !== workflow.id) {
    throw new InvalidInputError(`Proposal does not have the same workflow as the provided workflow`);
  }

  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < workflowEvaluations.length; i++) {
      const proposalEvaluation = proposalWithEvaluations.evaluations[i];
      const workflowEvaluation = workflowEvaluations[i];

      if (!proposalEvaluation) {
        throw new InvalidInputError(`Proposal does not have an evaluation at index ${i}`);
      }

      // Only proceed if evaluationIds is empty (sync everything) or the current evaluation id is in the list
      if (!evaluationIds?.length || evaluationIds.includes(proposalEvaluation.id)) {
        const isMatching =
          lowerCaseEqual(proposalEvaluation.title.trim(), workflowEvaluation.title.trim()) &&
          proposalEvaluation.type === workflowEvaluation.type;

        if (!isMatching) {
          throw new InvalidInputError(
            `Proposal evaluation ${proposalEvaluation.type}:${proposalEvaluation.title} at index ${i} does not match the workflow evaluation ${workflowEvaluation.type}:${workflowEvaluation.title}`
          );
        }

        const workflowPermissions = workflowEvaluation.permissions;

        await tx.proposalEvaluationPermission.deleteMany({
          where: {
            evaluationId: proposalEvaluation.id
          }
        });

        await tx.proposalEvaluationPermission.createMany({
          data: workflowPermissions.map(
            (permission) =>
              ({
                operation: permission.operation,
                roleId: permission.roleId,
                systemRole: permission.systemRole,
                userId: permission.userId,
                evaluationId: proposalEvaluation.id
              } as Prisma.ProposalEvaluationPermissionCreateManyInput)
          )
        });
      }
    }
  });
}
