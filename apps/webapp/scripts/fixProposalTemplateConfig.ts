import { InvalidInputError } from '@packages/core/errors';
import type { Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from '@packages/utils/strings';
import { v4 as uuid } from 'uuid';

async function getConfig({
  pagePathOrTitle,
  spaceDomain,
  workflowName
}: {
  pagePathOrTitle: string;
  spaceDomain: string;
  workflowName: string;
}) {
  if (!pagePathOrTitle || !spaceDomain || !workflowName) {
    throw new InvalidInputError(`pagePath, spaceDomain, and workflowName are required`);
  }

  const data = await prisma.space.findFirstOrThrow({
    where: {
      domain: spaceDomain
    },
    select: {
      domain: true,
      id: true,
      proposals: {
        where: {
          page: {
            type: 'proposal_template',
            OR: [
              {
                path: pagePathOrTitle
              },
              {
                title: {
                  contains: pagePathOrTitle
                }
              }
            ]
          }
        },
        select: {
          id: true,
          page: {
            select: {
              title: true,
              path: true
            }
          },
          status: true,
          evaluations: true
        }
      },
      proposalWorkflows: {
        where: {
          title: workflowName
        },
        select: {
          id: true,
          evaluations: true
        }
      }
    }
  });

  const template = data.proposals[0];

  const workflow = data.proposalWorkflows[0];

  if (!template) {
    throw new InvalidInputError(`template not found`);
  }
  if (!template || !workflow) {
    throw new InvalidInputError(`workflow not found`);
  } else if (data.proposals.length > 1) {
    throw new InvalidInputError(`multiple templates found`);
  } else if (data.proposalWorkflows.length > 1) {
    throw new InvalidInputError(`multiple workflows found`);
  }

  if (template.evaluations?.length) {
    throw new InvalidInputError('This template already has some evaluation');
  }

  const similarTemplate = await prisma.proposal.findFirst({
    where: {
      workflowId: workflow.id,
      page: {
        type: 'proposal_template'
      },
      id: {
        not: template.id
      },
      evaluations: {
        some: {}
      }
    },
    include: {
      page: {
        select: {
          title: true,
          path: true
        }
      },
      evaluations: {
        include: {
          rubricCriteria: true,
          reviewers: true
        }
      }
    }
  });

  if (!similarTemplate) {
    throw new InvalidInputError('A similar template needs to be created first');
  }

  console.log('------ CURRENT STATE ---------');
  prettyPrint({ template, workflow, similarTemplate });
  console.log('------ CURRENT STATE ---------');

  return {
    template,
    workflow,
    similarTemplate
  };
}

/**
 * Use this script to fix a proposal template that has no evaluations.
 *
 * Depends on having one other template for the target workflow that is already configured
 */
async function fixEmptyProposalTemplateConfig({
  pagePathOrTitle,
  spaceDomain,
  workflowName
}: {
  pagePathOrTitle: string;
  spaceDomain: string;
  workflowName: string;
}): Promise<void> {
  const { similarTemplate, template, workflow } = await getConfig({ pagePathOrTitle, spaceDomain, workflowName });

  await prisma.$transaction(async (tx) => {
    await tx.proposal.update({
      where: {
        id: template.id
      },
      data: {
        workflowId: workflow.id
      }
    });

    // Clean up reviewers so we can recreate them
    await tx.proposalReviewer.deleteMany({
      where: {
        proposalId: template.id
      }
    });

    await Promise.all(
      similarTemplate.evaluations.map((evaluation) =>
        tx.proposalEvaluation.create({
          data: {
            index: evaluation.index,
            title: evaluation.title,
            type: evaluation.type,
            voteSettings: evaluation.voteSettings as any,
            proposal: {
              connect: {
                id: template.id
              }
            },
            reviewers: {
              createMany: {
                data: evaluation.reviewers.map((reviewer) => ({
                  proposalId: template.id,
                  roleId: reviewer.roleId,
                  systemRole: reviewer.systemRole,
                  userId: reviewer.userId
                }))
              }
            },
            rubricCriteria: {
              createMany: {
                data: evaluation.rubricCriteria.map(
                  (criterion) =>
                    ({
                      parameters: criterion.parameters,
                      proposalId: template.id,
                      title: criterion.title,
                      type: criterion.type,
                      description: criterion.description,
                      id: uuid(),
                      index: criterion.index
                    }) as Prisma.ProposalRubricCriteriaCreateManyInput
                )
              }
            }
          }
        })
      )
    );
  });

  console.log('------ NEW STATE ---------');
  const updatedProposal = await prisma.proposal.findUniqueOrThrow({
    where: {
      id: template.id
    },
    include: {
      evaluations: {
        include: {
          reviewers: true
        }
      }
    }
  });

  prettyPrint({ updatedProposal });
  console.log('------ NEW STATE ---------');

  console.log('///////////////////////////////////////');
}

// fixEmptyProposalTemplateConfig({
//   pagePathOrTitle: 'page-3966003700025833',
//   spaceDomain: 'conservation-apein-kingfisher',
//   workflowName: 'Decision Matrix'
// }).then(() => console.log('Done'));

// Local testing utilities to reset proposal to null
// prisma.proposal.updateMany({
//   where: {
//     page: {
//       path: 'page-3966003700025833'
//     }
//   },
//   data: {
//     workflowId: null
//   }
// }).then(() => console.log('Done'));

// prisma.proposalEvaluation.deleteMany({
//   where: {
//     proposal: {
//       page: {
//         type: 'proposal_template',
//         path: 'page-3966003700025833'
//       }
//     }
//   }
// }).then(() => console.log('Done'));
