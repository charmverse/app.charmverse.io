import { ProposalOperation, prisma } from '@charmverse/core/prisma-client';
import { ProposalWorkflowTyped } from '@packages/core/proposals';

const spaceDomain = 'demo-space';

async function makeAllProposalsPublic() {
  const spaceId = await prisma.space
    .findUniqueOrThrow({
      where: {
        domain: spaceDomain
      },
      select: {
        id: true
      }
    })
    .then((space) => space.id);

  const workflows = (await prisma.proposalWorkflow.findMany({
    where: {
      spaceId: spaceId
    }
  })) as ProposalWorkflowTyped[];

  let i = 0;

  for (const workflow of workflows) {
    i += 1;
    const updatedEvaluations = workflow.evaluations.map((evaluation) => {
      const existingPublicEvaluationPermission = evaluation.permissions.find(
        (permission) => permission.systemRole === 'public'
      );

      if (!existingPublicEvaluationPermission) {
        return {
          ...evaluation,
          permissions: [
            ...evaluation.permissions,
            {
              systemRole: 'public',
              operation: 'view' as ProposalOperation
            }
          ]
        };
      }
      return evaluation;
    });
    await prisma.proposalWorkflow.update({
      where: {
        id: workflow.id
      },
      data: {
        evaluations: updatedEvaluations
      }
    });

    console.log(`Updated proposal workflow ${i} / ${workflows.length}`);
  }

  const evaluationsWithoutPublicPermission = await prisma.proposalEvaluation.findMany({
    where: {
      proposal: {
        spaceId: spaceId
      },
      permissions: {
        none: {
          systemRole: 'public'
        }
      }
    },
    select: {
      id: true
    }
  });

  const createdPermissions = await prisma.proposalEvaluationPermission.createMany({
    data: evaluationsWithoutPublicPermission.map((evaluation) => ({
      evaluationId: evaluation.id,
      systemRole: 'public',
      operation: 'view' as ProposalOperation
    }))
  });

  console.log(`Updated ${createdPermissions.count} evaluations with public permissions`);
}

makeAllProposalsPublic();
