import type { PagePermissionLevel, Prisma, ProposalStatus } from '@prisma/client';
import { v4 } from 'uuid';

import type { OptionalTransaction, TransactionClient } from 'db';
import { prisma } from 'db';
import type { IPageWithPermissions } from 'lib/pages/interfaces';
import { resolvePageTree } from 'lib/pages/server';

import { comparePermissionLevels } from '../permissions/pages';

type ProposalParticipant = 'author' | 'reviewer' | 'community';

type ProposalStagePagePermissionMapping = Record<ProposalParticipant, PagePermissionLevel | null>;

export const proposalPermissionMapping: Record<ProposalStatus, ProposalStagePagePermissionMapping> = {
  private_draft: {
    author: 'proposal_editor',
    reviewer: null,
    community: null
  },
  draft: {
    author: 'proposal_editor',
    reviewer: null,
    community: 'view'
  },
  discussion: {
    author: 'proposal_editor',
    reviewer: null,
    community: 'view_comment'
  },
  review: {
    author: 'view_comment',
    reviewer: 'view_comment',
    community: 'view'
  },
  reviewed: {
    author: null,
    reviewer: null,
    community: 'view'
  },
  vote_active: {
    author: null,
    reviewer: null,
    community: 'view'
  },
  vote_closed: {
    author: null,
    reviewer: null,
    community: 'view'
  }
};

/**
 * @isNewProposal - The proposal was just created. Used so we dont't needlessly search for children
 */
export interface ProposalPermissionsSync {
  proposalId: string;
  isNewProposal?: boolean;
}

/**
 * Generates proposal page permission prisma arguments to be consumed inside updateProposalStatus
 */
export async function generateSyncProposalPermissions ({ proposalId, isNewProposal, tx = prisma }: ProposalPermissionsSync & OptionalTransaction):
  Promise<[Prisma.PagePermissionDeleteManyArgs, Prisma.PagePermissionCreateArgs[]]> {
  const queryResult = await tx.page.findUnique({
    where: {
      proposalId
    },
    include: {
      permissions: true,
      proposal: {
        include: {
          authors: true,
          reviewers: true
        }
      }
    }
  });

  const page = queryResult;
  const proposal = queryResult?.proposal;

  if (!proposal || !page) {
    throw new Error(`Proposal or page with id ${proposalId} not found`);
  }

  // Delete permissions
  // Check if there are children so we don't perform resolve page tree operation for nothing
  let children = isNewProposal ? [] : await tx.page.findMany({
    where: {
      parentId: page.id
    },
    select: {
      id: true,
      permissions: {
        include: {
          sourcePermission: true
        }
      }
    }
  });

  if (children.length > 0) {
    children = (await resolvePageTree({
      pageId: page.id,
      flattenChildren: true,
      includeDeletedPages: true,
      tx
    })).flatChildren;
  }

  // -------------------- Create permissions
  const createProposalPermissionArgs: Prisma.PagePermissionCreateArgs[] = [];
  const createChildProposalPermissionArgs: Prisma.PagePermissionCreateArgs[] = [];

  // Create permissions

  const currentStage = proposal.status;

  const authorPermissionSetting = proposalPermissionMapping[currentStage].author;
  const reviewerPermissionSetting = proposalPermissionMapping[currentStage].reviewer;
  const communityPermissionSetting = proposalPermissionMapping[currentStage].community;

  if (authorPermissionSetting !== null) {
    proposal.authors.forEach(a => {

      const newId = v4();

      const authorPermission: Prisma.PagePermissionCreateArgs = {
        data: {
          id: newId,
          permissionLevel: authorPermissionSetting,
          user: {
            connect: {
              id: a.userId
            }
          },
          page: {
            connect: {
              id: page.id
            }
          }
        }
      };

      createProposalPermissionArgs.push(authorPermission);
    });
  }

  if (reviewerPermissionSetting !== null) {
    proposal.reviewers.forEach(reviewer => {

      const assignedAuthor = reviewer.userId ? createProposalPermissionArgs.find(permissionArgs => {
        return permissionArgs.data.user?.connect?.id === reviewer.userId;
      }) : undefined;

      // If author is also a reviewer, only assign a permission if this is higher
      const isHigherPermissionLevel = assignedAuthor && comparePermissionLevels({
        base: assignedAuthor.data.permissionLevel as PagePermissionLevel, comparison: reviewerPermissionSetting
      }) === 'more';

      if (isHigherPermissionLevel) {
        assignedAuthor.data.permissionLevel = reviewerPermissionSetting;
      }
      else if (!assignedAuthor) {
        const newId = v4();
        const reviewerPermission: Prisma.PagePermissionCreateArgs = {
          data: {
            id: newId,
            permissionLevel: reviewerPermissionSetting,
            role: reviewer.roleId ? {
              connect: {
                id: reviewer.roleId
              }
            } : undefined,
            user: reviewer.userId ? {
              connect: {
                id: reviewer.userId
              }
            } : undefined,
            page: {
              connect: {
                id: page.id
              }
            }
          }
        };

        createProposalPermissionArgs.push(reviewerPermission);
      }
    });
  }

  if (communityPermissionSetting !== null) {

    const newId = v4();

    createProposalPermissionArgs.push({
      data: {
        id: newId,
        permissionLevel: communityPermissionSetting,
        space: {
          connect: {
            id: proposal.spaceId
          }
        },
        page: {
          connect: {
            id: page.id
          }
        }
      }
    });
  }

  children.forEach(child => {
    createProposalPermissionArgs.forEach(permission => {

      const assignee: 'user' | 'role' | 'space' = permission.data.user ? 'user' : permission.data.role ? 'role' : 'space';

      const assigneeId = (assignee === 'user' ? permission.data.user?.connect?.id : assignee === 'role' ? permission.data.role?.connect?.id : permission.data.space?.connect?.id) as string;

      const permissionLevel = permission.data.permissionLevel as PagePermissionLevel;

      const newId = v4();

      const inheritId = permission.data.id as string;

      createChildProposalPermissionArgs.push({
        data: {
          id: newId,
          permissionLevel,
          role: assignee === 'role' ? {
            connect: {
              id: assigneeId
            }
          } : undefined,
          user: assignee === 'user' ? {
            connect: {
              id: assigneeId
            }
          } : undefined,
          space: assignee === 'space' ? {
            connect: {
              id: assigneeId
            }
          } : undefined,
          page: {
            connect: {
              id: child.id
            }
          },
          sourcePermission: {
            connect: {
              id: inheritId
            }
          }
        }
      });
    });
  });

  const deletePermissionPageIds = children.length === 0 ? [page.id] : [page.id, ...children.map((child) => child.id)];

  const deletePermissionArgs: Prisma.PagePermissionDeleteManyArgs = {
    where: {
      AND: [
        {
          pageId: {
            in: deletePermissionPageIds
          }
        },
        {
          OR: [{
            public: false
          }, {
            public: null
          }]
        }
      ]
    }
  };

  return [
    deletePermissionArgs,
    [...createProposalPermissionArgs, ...createChildProposalPermissionArgs]
  ];

}

export async function syncProposalPermissions ({ proposalId, tx }: ProposalPermissionsSync & OptionalTransaction): Promise<IPageWithPermissions> {

  if (!tx) {
    return prisma.$transaction(txHandler);
  }

  return txHandler(tx);

  // eslint-disable-next-line @typescript-eslint/no-shadow
  async function txHandler (tx: TransactionClient) {
    const [deletePermissionArgs, upsertPermissionArgs] = await generateSyncProposalPermissions({ proposalId, tx });

    await tx.pagePermission.deleteMany(deletePermissionArgs);

    for (const permissionArgs of upsertPermissionArgs) {
      await tx.pagePermission.create(permissionArgs);
    }
    // TEST

    return tx.page.findUnique({
      where: {
        proposalId
      },
      include: {
        permissions: {
          include: {
            sourcePermission: true
          }
        }
      }
    }) as Promise<IPageWithPermissions>;
  }

}
