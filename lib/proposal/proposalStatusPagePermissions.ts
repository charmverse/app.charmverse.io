import { PagePermissionLevel, Prisma, ProposalStatus } from '@prisma/client';
import { prisma } from 'db';
import { IPageWithPermissions } from 'lib/pages';
import { resolvePageTree } from 'lib/pages/server';
import { v4 } from 'uuid';
import { IPagePermissionToCreate } from '../permissions/pages';

type ProposalParticipant = 'author' | 'reviewer' | 'community';

type ProposalStagePagePermissionMapping = Record<ProposalParticipant, PagePermissionLevel | null>;

export const proposalPermissionMapping: Record<ProposalStatus, ProposalStagePagePermissionMapping> = {
  private_draft: {
    author: 'full_access',
    reviewer: null,
    community: null
  },
  draft: {
    author: 'full_access',
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
  Promise<[Prisma.PagePermissionDeleteManyArgs, Prisma.PagePermissionCreateManyArgs, Prisma.PagePermissionCreateManyArgs]> {
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
  // Check if there are children so we don't perform resolve page tree operation for nothin
  let children = await prisma.page.findMany({
    where: {
      parentId: page.id
    },
    select: {
      id: true
    }
  });

  if (children.length > 0) {
    children = (await resolvePageTree({
      pageId: page.id,
      flattenChildren: true,
      includeDeletedPages: true
    })).flatChildren;
  }

  const deletePermissionsArgs: Prisma.PagePermissionDeleteManyArgs = {
    where: {
      pageId: {
        in: [page.id, ...children.map(child => child.id)]
      },
      // Don't mess with existing public permissions
      public: {
        not: true
      }
    }
  };

  // Create permissions

  const permissionsToAssign: (IPagePermissionToCreate & {pageId: string})[] = [];

  const currentStage = proposal.status;

  if (proposalPermissionMapping[currentStage].author !== null) {
    proposal.authors.forEach(a => {

      permissionsToAssign.push({
        pageId: page.id,
        userId: a.userId,
        permissionLevel: proposalPermissionMapping[currentStage].author as PagePermissionLevel
      });
    });
  }

  if (proposalPermissionMapping[currentStage].reviewer !== null) {
    proposal.reviewers.forEach(r => {

      if ((r.roleId || r.userId) && (
        permissionsToAssign.every(p => r.userId ? r.userId !== p.userId : r.roleId !== p.roleId)
      )) {

        permissionsToAssign.push({
          pageId: page.id,
          // Only one of these should exist
          userId: r.userId,
          roleId: r.roleId,
          permissionLevel: proposalPermissionMapping[currentStage].reviewer as PagePermissionLevel
        });
      }
    });
  }

  if (proposalPermissionMapping[currentStage].community !== null) {
    permissionsToAssign.push({
      id: v4(),
      pageId: page.id,
      spaceId: page.spaceId,
      permissionLevel: proposalPermissionMapping[currentStage].community as PagePermissionLevel
    });
  }

  const childPermissionsToAssign: (IPagePermissionToCreate & {pageId: string})[] = [];

  if (children.length > 0) {
    const { flatChildren } = await resolvePageTree({
      pageId: page.id,
      flattenChildren: true,
      includeDeletedPages: true
    });

    flatChildren.forEach(child => {
      permissionsToAssign.forEach(perm => {
        childPermissionsToAssign.push({
          ...perm,
          pageId: child.id,
          inheritedFromPermission: perm.id
        });
      });
    });
  }

  return [
    deletePermissionsArgs,
    {
      data: permissionsToAssign
    },
    {
      data: childPermissionsToAssign
    }
  ];

}

export async function execSyncProposalPermissions ({ proposalId }: ProposalPermissionsSync): Promise<IPageWithPermissions> {

  const [deleteArgs, proposalArgs, childArgs] = await generateSyncProposalPermissions({ proposalId });

  return prisma.$transaction([
    prisma.pagePermission.deleteMany(deleteArgs),
    prisma.pagePermission.createMany(proposalArgs),
    prisma.pagePermission.createMany(childArgs),
    prisma.page.findUnique({
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
    })
  ]).then(data => {
    return data[3] as IPageWithPermissions;
  });
}
