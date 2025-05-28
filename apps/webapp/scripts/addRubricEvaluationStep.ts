import { prisma } from '@charmverse/core/prisma-client';

/**
 * Use this script to perform database searches.
 */

async function addRubricEvaluationStep() {
  const proposalPaths: string[] = [];
  const spaceDomain = 'op-grants';
  const criterias: string[] = [];
  const reviewerRoleTitle = 'Superchain reviewers',
    approverRoleTitle = 'Approvers';
  const space = await prisma.space.findFirstOrThrow({
    where: {
      domain: spaceDomain
    },
    select: {
      id: true
    }
  });

  const reviewerRole = await prisma.role.findFirstOrThrow({
    where: {
      name: reviewerRoleTitle,
      spaceId: space.id,
      archived: false
    }
  });
  const approverRole = await prisma.role.findFirstOrThrow({
    where: {
      name: approverRoleTitle,
      spaceId: space.id,
      archived: false
    }
  });

  const rubricTitle = 'Superchain Rubric';
  const rubricIndex = 2;

  for (const proposalPath of proposalPaths) {
    const proposal = await prisma.proposal.findFirstOrThrow({
      where: {
        page: {
          path: proposalPath
        }
      },
      select: {
        id: true,
        spaceId: true
      }
    });

    await prisma.proposalEvaluation.updateMany({
      where: {
        proposalId: proposal.id,
        index: {
          gte: rubricIndex
        }
      },
      data: {
        index: {
          increment: 1
        }
      }
    });

    await prisma.proposalEvaluation.create({
      data: {
        index: rubricIndex,
        title: rubricTitle,
        type: 'rubric',
        proposalId: proposal.id,
        evaluationApprovers: {
          create: [
            {
              proposalId: proposal.id,
              roleId: approverRole.id
            }
          ]
        },
        reviewers: {
          create: [
            {
              proposalId: proposal.id,
              roleId: reviewerRole.id
            }
          ]
        },
        rubricCriteria: {
          createMany: {
            data: criterias.map((title) => ({
              parameters: { max: 1, min: 0 },
              proposalId: proposal.id,
              title,
              type: 'range'
            }))
          }
        }
      }
    });
  }
}

addRubricEvaluationStep();
