import type { Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { InvalidInputError } from '@packages/core/errors';
import type { ProposalWorkflowTyped } from '@packages/core/proposals';
import { lowerCaseEqual } from '@packages/utils/strings';

export async function syncProposalPermissionsWithWorkflowPermissions({
  proposalId,
  evaluationIds,
  tx
}: {
  proposalId: string;
  evaluationIds?: string[];
  tx?: Prisma.TransactionClient;
}): Promise<void> {
  // Wrap the mutation in a transaction so the proposal state is consistent
  async function txHandler(_tx: Prisma.TransactionClient) {
    const proposalWithEvaluations = await _tx.proposal.findUniqueOrThrow({
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

    const totalProposalEvaluations = proposalWithEvaluations.evaluations.length;

    // This allows the proposal to have more evaluations than the workflow at the end, as long as all previous evaluations match the workflow
    for (let i = 0; i < totalProposalEvaluations; i++) {
      const proposalEvaluation = proposalWithEvaluations.evaluations[i];
      const workflowEvaluation = workflowEvaluations[i];

      if (!workflowEvaluation) {
        throw new InvalidInputError(`Workf;ow does not have an evaluation at index ${i}`);
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

        await _tx.proposalEvaluationPermission.deleteMany({
          where: {
            evaluationId: proposalEvaluation.id
          }
        });

        await _tx.proposalEvaluationPermission.createMany({
          data: workflowPermissions.map(
            (permission) =>
              ({
                operation: permission.operation,
                roleId: permission.roleId,
                systemRole: permission.systemRole,
                userId: permission.userId,
                evaluationId: proposalEvaluation.id
              }) as Prisma.ProposalEvaluationPermissionCreateManyInput
          )
        });
      }
    }
  }

  if (tx) {
    await txHandler(tx);
  } else {
    await prisma.$transaction(txHandler);
  }
}
