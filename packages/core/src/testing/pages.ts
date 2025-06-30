import type { Comment, Page, Prisma, Thread } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { v4 } from 'uuid';

import { DataNotFoundError, InvalidInputError, PageNotFoundError } from '../errors';
import type { PageNode, PageWithPermissions } from '../pages/interfaces';
import type { PagePermissionAssignmentByValues } from '../permissions/pages/interfaces';

type OptionalPagePermissionsToGenerate = {
  pagePermissions?: (PagePermissionAssignmentByValues & {
    inheritedFromPermission?: string;
    allowDiscovery?: boolean;
  })[];
};

type PageGenerateArgs = Pick<Page, 'createdBy' | 'spaceId'> &
  Partial<
    Pick<
      Page,
      | 'id'
      | 'content'
      | 'contentText'
      | 'parentId'
      | 'title'
      | 'type'
      | 'deletedAt'
      | 'path'
      | 'proposalId'
      | 'bountyId'
      | 'index'
      | 'syncWithPageId'
      | 'additionalPaths'
      | 'sourceTemplateId'
      | 'isLocked'
      | 'lockedBy'
    >
  > &
  OptionalPagePermissionsToGenerate;

export function generatePage({
  id,
  createdBy,
  spaceId,
  content = null,
  contentText,
  pagePermissions,
  parentId,
  title,
  type,
  path,
  proposalId,
  bountyId,
  deletedAt,
  index,
  syncWithPageId,
  additionalPaths,
  sourceTemplateId,
  isLocked,
  lockedBy
}: PageGenerateArgs): Promise<Page> {
  return prisma.page.create({
    data: {
      id: id ?? v4(),
      deletedAt,
      title: title ?? 'Page title',
      path: path ?? `page-${v4()}`,
      type: type ?? 'page',
      updatedBy: createdBy,
      content: content as any,
      contentText: contentText ?? '',
      syncWithPageId,
      isLocked,
      lockedBy,
      parent: parentId
        ? {
            connect: {
              id: parentId
            }
          }
        : undefined,
      index,
      additionalPaths,
      sourceTemplateId,
      proposal: proposalId
        ? {
            connect: {
              id: proposalId
            }
          }
        : undefined,
      bounty: bountyId
        ? {
            connect: {
              id: bountyId
            }
          }
        : undefined,
      author: {
        connect: {
          id: createdBy
        }
      },
      space: {
        connect: {
          id: spaceId
        }
      },
      permissions:
        pagePermissions && pagePermissions.length > 0
          ? {
              createMany: {
                data: pagePermissions.map((permissionInput) => {
                  return {
                    permissionLevel: permissionInput.permissionLevel,
                    inheritedFromPermission: permissionInput.inheritedFromPermission,
                    public: permissionInput.assignee.group === 'public' ? true : undefined,
                    roleId: permissionInput.assignee.group === 'role' ? permissionInput.assignee.id : undefined,
                    spaceId: permissionInput.assignee.group === 'space' ? permissionInput.assignee.id : undefined,
                    userId: permissionInput.assignee.group === 'user' ? permissionInput.assignee.id : undefined,
                    allowDiscovery: permissionInput.allowDiscovery
                  } as Omit<Prisma.PagePermissionCreateManyInput, 'pageId'>;
                })
              }
            }
          : undefined
    }
  });
}
/**
 * This function provides a subset of Pages, which is enough to create simulated trees and assess tree resolution behaviour
 */
export function generatePageNode({
  // Default values for props reflects our app defaults
  id = v4(),
  parentId = null,
  type = 'page',
  index = -1,
  deletedAt = null,
  createdAt = new Date(),
  title = 'Untitled',
  spaceId = v4()
}: Partial<PageNode<Pick<Page, 'title'>>>): PageNode<Pick<Page, 'title'>> {
  return {
    id,
    type,
    parentId,
    index,
    createdAt,
    deletedAt,
    title,
    spaceId
  };
}

export async function getPageWithPermissions(pageId: string): Promise<PageWithPermissions> {
  return prisma.page.findUniqueOrThrow({
    where: {
      id: pageId
    },
    include: {
      permissions: {
        include: {
          sourcePermission: true
        }
      }
    }
  });
}
export async function generateCommentWithThreadAndPage({
  userId,
  spaceId,
  commentContent,
  pagePermissions,
  pageId,
  threadId
}: {
  userId: string;
  spaceId: string;
  commentContent: any;
  pageId?: string;
  threadId?: string;
} & OptionalPagePermissionsToGenerate): Promise<{ page: Page; thread: Thread; comment: Comment }> {
  if (threadId && !pageId) {
    throw new InvalidInputError(`Please also provide the page ID for the thread`);
  }

  const page = pageId
    ? await prisma.page.findUnique({ where: { id: pageId } })
    : await generatePage({
        createdBy: userId,
        spaceId,
        pagePermissions
      });

  if (!page) {
    throw new PageNotFoundError(pageId as string);
  }

  const thread = threadId
    ? await prisma.thread.findUnique({
        where: { id: threadId }
      })
    : await prisma.thread.create({
        data: {
          context: 'Random context',
          resolved: false,
          page: {
            connect: {
              id: page.id
            }
          },
          user: {
            connect: {
              id: userId
            }
          },
          space: {
            connect: {
              id: spaceId
            }
          }
        }
      });

  if (!thread) {
    throw new DataNotFoundError(`Thread with id ${threadId} not found`);
  }

  if (thread.pageId !== page.id) {
    throw new InvalidInputError(
      `thread.pageId and page.id mismatched. Thread must belong to the page if threadId and pageId are provided`
    );
  }

  const comment = await prisma.comment.create({
    data: {
      page: {
        connect: {
          id: page.id
        }
      },
      content: commentContent,
      thread: {
        connect: {
          id: thread.id
        }
      },
      user: {
        connect: {
          id: userId
        }
      },
      space: {
        connect: {
          id: spaceId
        }
      }
    }
  });

  return {
    page,
    thread,
    comment
  };
}
