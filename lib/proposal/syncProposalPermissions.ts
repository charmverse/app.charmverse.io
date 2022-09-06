import { PagePermission, PagePermissionLevel, Prisma, ProposalStatus } from '@prisma/client';
import { prisma } from 'db';
import { IPageWithPermissions } from 'lib/pages';
import { resolvePageTree } from 'lib/pages/server';
import { createPage } from 'testing/setupDatabase';
import { v4 } from 'uuid';
import { comparePermissionLevels, IPagePermissionToCreate } from '../permissions/pages';

type ProposalParticipant = 'author' | 'reviewer' | 'community';

type ProposalStagePagePermissionMapping = Record<ProposalParticipant, PagePermissionLevel | null>;

export const proposalPermissionMapping: Record<ProposalStatus, ProposalStagePagePermissionMapping> = {
  private_draft: {
    author: 'full_access',
    reviewer: null,
    community: null
  },
  draft: {
    author: null,
    reviewer: null,
    community: 'view'
  },
  discussion: {
    author: 'full_access',
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

export interface ProposalPermissionsSync {
  proposalId: string;
}

/**
 * Generates proposal page permission prisma arguments to be consumed inside updateProposalStatus
 */
export async function generateSyncProposalPermissions ({ proposalId }: ProposalPermissionsSync):
  Promise<[Prisma.PagePermissionDeleteManyArgs, Prisma.PagePermissionUpsertArgs[]]> {
  const [page, proposal] = await Promise.all([
    prisma.page.findUnique({
      where: {
        proposalId
      },
      include: {
        permissions: true
      }
    }),
    prisma.proposal.findUnique({
      where: {
        id: proposalId
      },
      include: {
        authors: true,
        reviewers: true
      }
    })
  ]);

  if (!proposal || !page) {
    throw new Error(`Proposal or page with id ${proposalId} not found`);
  }

  // Delete permissions
  // Check if there are children so we don't perform resolve page tree operation for nothing
  let children = await prisma.page.findMany({
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
      includeDeletedPages: true
    })).flatChildren;
  }

  // -------------------- Create permissions
  const upsertProposalPermissionArgs: Prisma.PagePermissionUpsertArgs[] = [];
  const upsertChildProposalPermissionArgs: Prisma.PagePermissionUpsertArgs[] = [];

  // Create permissions

  const currentStage = proposal.status;

  const authorPermissionSetting = proposalPermissionMapping[currentStage].author;
  const reviewerPermissionSetting = proposalPermissionMapping[currentStage].reviewer;
  const communityPermissionSetting = proposalPermissionMapping[currentStage].community;

  if (authorPermissionSetting !== null) {
    proposal.authors.forEach(a => {

      const newId = v4();

      const authorPermission: Prisma.PagePermissionUpsertArgs = {
        where: {
          userId_PageId: {
            pageId: page.id,
            userId: a.userId
          }
        },
        create: {
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
        },
        update: {
          id: newId,
          permissionLevel: authorPermissionSetting,
          sourcePermission: {
            disconnect: true
          }
        }
      };

      upsertProposalPermissionArgs.push(authorPermission);
    });
  }

  if (reviewerPermissionSetting !== null) {
    proposal.reviewers.forEach(reviewer => {

      const assignedAuthor = reviewer.userId ? upsertProposalPermissionArgs.find(permissionArgs => {
        return permissionArgs.create.user?.connect?.id === reviewer.userId;
      }) : undefined;

      // If author is also a reviewer, only assign a permission if this is higher
      if (assignedAuthor && comparePermissionLevels({
        base: assignedAuthor.update.permissionLevel as PagePermissionLevel, comparison: reviewerPermissionSetting }) === 'more'
      ) {
        assignedAuthor.update.permissionLevel = reviewerPermissionSetting;
      }
      else if (!assignedAuthor) {
        const newId = v4();
        const reviewerPermission: Prisma.PagePermissionUpsertArgs = {
          where: reviewer.userId ? {
            userId_PageId: {
              pageId: page.id,
              userId: reviewer.userId
            }
          } : {
            roleId_pageId: {
              pageId: page.id,
              roleId: reviewer.roleId as string
            }
          },
          create: {
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
          },
          update: {
            id: newId,
            permissionLevel: reviewerPermissionSetting,
            sourcePermission: {
              disconnect: true
            }
          }
        };

        upsertProposalPermissionArgs.push(reviewerPermission);
      }
    });
  }

  if (communityPermissionSetting !== null) {

    const newId = v4();

    upsertProposalPermissionArgs.push({
      where: {
        spaceId_pageId: {
          pageId: page.id,
          spaceId: proposal.spaceId
        }
      },
      create: {
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
      },
      update: {
        id: newId,
        permissionLevel: communityPermissionSetting,
        sourcePermission: {
          disconnect: true
        }
      }
    });
  }

  children.forEach(child => {
    upsertProposalPermissionArgs.forEach(permission => {

      const assignee: 'user' | 'role' | 'space' = permission.where.userId_PageId ? 'user' : permission.where.roleId_pageId ? 'role' : 'space';

      const assigneeId = (assignee === 'user' ? permission.where.userId_PageId?.userId : assignee === 'role' ? permission.where.roleId_pageId?.roleId : permission.where.spaceId_pageId?.spaceId) as string;

      const permissionLevel = permission.update.permissionLevel as PagePermissionLevel;

      const newId = v4();

      const inheritId = v4() as string;

      upsertChildProposalPermissionArgs.push({
        where: assignee === 'user' ? {
          userId_PageId: {
            pageId: child.id,
            userId: assigneeId
          }
        } : assignee === 'role' ? {
          roleId_pageId: {
            pageId: child.id,
            roleId: assigneeId
          }
        } : {
          spaceId_pageId: {
            pageId: child.id,
            spaceId: assigneeId
          }
        },
        create: {
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
        },
        update: {
          id: newId,
          permissionLevel,
          sourcePermission: {
            connect: {
              id: inheritId
            }
          }
        }
      });
    });
  });

  // const deletePermissionPageIds = children.length === 0 ? [page.id] : [page.id, ...children.map((child) => child.id)];

  // const permissionIdsToIgnore = upsertProposalPermissionArgs.map((permission) => permission.create.id) as string[];

  // const deleteProposalPermissionsArgs: Prisma.PagePermissionDeleteManyArgs = {
  //   where: {
  //     id: {
  //       notIn: permissionIdsToIgnore
  //     },
  //     pageId: {
  //       in: deletePermissionPageIds
  //     },
  //     OR: [{
  //       public: false
  //     }, {
  //       public: null
  //     }]
  //   }
  // };

  // const updateManyInput: Partial<Pick<PagePermission, 'pageId' | 'userId' | 'roleId' | 'spaceId'>>[] = upsertChildProposalPermissionArgs.map((upsert) => {
  //   if (upsert.where.userId_PageId) {
  //     return {
  //       userId: upsert.where.userId_PageId.userId,
  //       pageId: upsert.where.userId_PageId.pageId
  //     };
  //   }
  //   else if (upsert.where.roleId_pageId) {
  //     return {
  //       roleId: upsert.where.roleId_pageId.roleId,
  //       pageId: upsert.where.roleId_pageId.pageId
  //     };
  //   }
  //   else {
  //     return {
  //       spaceId: upsert.where.spaceId_pageId?.spaceId as string,
  //       pageId: upsert.where.spaceId_pageId?.pageId as string
  //     };
  //   }
  // });

  const deletePermissionArgs: Prisma.PagePermissionDeleteManyArgs = {
    where: {
      pageId: {
        in: [page, ...children].map(_page => _page.id)
      },
      OR: [{
        public: false
      }, {
        public: null
      }]
    }
  };

  return [
    deletePermissionArgs,
    [...upsertProposalPermissionArgs, ...upsertChildProposalPermissionArgs]
    // deleteProposalPermissionsArgs
  ];

}

export async function syncProposalPermissions ({ proposalId }: ProposalPermissionsSync): Promise<IPageWithPermissions> {

  const [deletePermissionArgs, upsertPermissionArgs] = await generateSyncProposalPermissions({ proposalId });

  // TEST

  await prisma.$transaction([
    prisma.pagePermission.deleteMany(deletePermissionArgs),
    ...upsertPermissionArgs.map(arg => prisma.pagePermission.upsert(arg)) as any[]
  ]);

  return prisma.page.findUnique({
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
