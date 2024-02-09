import crypto, { randomUUID } from 'node:crypto';

import type { PageWithPermissions } from '@charmverse/core/pages';
import type {
  ApplicationStatus,
  Block,
  Bounty,
  BountyStatus,
  Comment,
  Page,
  Post,
  PostComment,
  ProposalStatus,
  Role,
  RoleSource,
  SubscriptionTier,
  Thread,
  Transaction,
  User,
  Vote
} from '@charmverse/core/prisma';
import { Prisma } from '@charmverse/core/prisma';
import type { Application, PagePermission, PageType } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { v4 } from 'uuid';

import type { DataSourceType } from 'lib/focalboard/board';
import type { IViewType } from 'lib/focalboard/boardView';
import { provisionApiKey } from 'lib/middleware/requireApiKey';
import type { NotificationToggles } from 'lib/notifications/notificationToggles';
import { createPage as createPageDb } from 'lib/pages/server/createPage';
import { getPagePath } from 'lib/pages/utils';
import type { BountyPermissions } from 'lib/permissions/bounties';
import type { TargetPermissionGroup } from 'lib/permissions/interfaces';
import type { ProposalWithUsersAndRubric } from 'lib/proposal/interface';
import { emptyDocument } from 'lib/prosemirror/constants';
import { getRewardOrThrow } from 'lib/rewards/getReward';
import type { ApplicationMeta } from 'lib/rewards/interfaces';
import { sessionUserRelations } from 'lib/session/config';
import { createUserFromWallet } from 'lib/users/createUser';
import { uniqueValues } from 'lib/utilities/array';
import { randomETHWalletAddress } from 'lib/utilities/blockchain';
import { InvalidInputError } from 'lib/utilities/errors';
import { typedKeys } from 'lib/utilities/objects';
import { uid } from 'lib/utilities/strings';
import type { LoggedInUser } from 'models';

import type { CustomBoardProps } from './generateBoardStub';
import { boardWithCardsArgs } from './generateBoardStub';

export async function generateSpaceUser({
  spaceId,
  isAdmin,
  isGuest
}: {
  spaceId: string;
  isAdmin?: boolean;
  isGuest?: boolean;
}): Promise<LoggedInUser> {
  return prisma.user.create({
    data: {
      path: uid(),
      identityType: 'Discord',
      username: 'Username',
      wallets: {
        create: {
          address: randomETHWalletAddress().toLowerCase()
        }
      },
      spaceRoles: {
        create: {
          space: {
            connect: {
              id: spaceId
            }
          },
          isAdmin,
          isGuest: !isAdmin && isGuest
        }
      }
    },
    include: sessionUserRelations
  });
}

/**
 * Simple utility to provide a user and space object inside test code
 * @param walletAddress
 * @deprecated - this calls createUserFromWallet() which should not be called during tests. Please use generateUserAndSpace() instead
 * @returns
 */
export async function generateUserAndSpaceWithApiToken(
  { email, walletAddress }: { email?: string; walletAddress?: string } = {},
  isAdmin = true,
  spaceName = 'Example space'
) {
  const user = await createUserFromWallet({ email, address: walletAddress });

  const existingSpaceId = user.spaceRoles?.[0]?.spaceId;

  let space = null;

  if (existingSpaceId) {
    space = await prisma.space.findUnique({
      where: { id: user.spaceRoles?.[0]?.spaceId },
      include: { apiToken: true, spaceRoles: true }
    });
  }

  if (!space) {
    space = await prisma.space.create({
      data: {
        name: spaceName,
        // Adding prefix avoids this being evaluated as uuid
        domain: `domain-${v4()}`,
        author: {
          connect: {
            id: user.id
          }
        },
        webhookSubscriptionUrl: 'https://test.com/webhook',
        webhookSigningSecret: crypto.randomBytes(160 / 8).toString('hex'),
        updatedBy: user.id,
        updatedAt: new Date().toISOString(),
        spaceRoles: {
          create: {
            userId: user.id,
            isAdmin
          }
        }
      },
      include: {
        apiToken: true,
        spaceRoles: true
      }
    });
  }

  const apiToken = (space as any).apiToken ?? (await provisionApiKey(space.id));

  return {
    user,
    space,
    apiToken
  };
}

type CreateUserAndSpaceInput = {
  user?: Partial<User>;
  isAdmin?: boolean;
  isGuest?: boolean;
  onboarded?: boolean;
  spaceName?: string;
  spaceCustomDomain?: string;
  publicBountyBoard?: boolean;
  paidTier?: SubscriptionTier;
  superApiTokenId?: string;
  walletAddress?: string;
  spaceNotificationToggles?: NotificationToggles;
  xpsEngineId?: string;
  snapshotDomain?: string;
};

export async function generateUserAndSpace({
  user,
  isAdmin,
  isGuest,
  onboarded = true,
  spaceName = 'Example Space',
  spaceCustomDomain,
  publicBountyBoard,
  superApiTokenId,
  walletAddress,
  paidTier,
  spaceNotificationToggles,
  xpsEngineId,
  snapshotDomain
}: CreateUserAndSpaceInput = {}) {
  const userId = v4();
  const newUser = await prisma.user.create({
    data: {
      id: userId,
      identityType: 'Wallet',
      username: `Test user ${Math.random()}`,
      spaceRoles: {
        create: {
          isAdmin,
          isGuest: !isAdmin && isGuest,
          onboarded,
          space: {
            create: {
              author: {
                connect: {
                  id: userId
                }
              },
              paidTier,
              updatedBy: userId,
              name: spaceName,
              // Adding prefix avoids this being evaluated as uuid
              domain: `domain-${v4()}`,
              customDomain: spaceCustomDomain,
              publicBountyBoard,
              notificationToggles: spaceNotificationToggles,
              ...(superApiTokenId ? { superApiToken: { connect: { id: superApiTokenId } } } : undefined),
              xpsEngineId,
              snapshotDomain
            }
          }
        }
      },
      path: uid(),
      ...(walletAddress
        ? {
            wallets: {
              create: {
                address: walletAddress.toLowerCase()
              }
            }
          }
        : undefined),
      ...user
    },
    include: {
      spaceRoles: {
        include: {
          space: true
        }
      }
    }
  });

  const { spaceRoles, ...userResult } = newUser;

  return {
    user: userResult,
    space: spaceRoles[0].space
  };
}

export async function generateBounty({
  proposalId,
  content = undefined,
  contentText = '',
  spaceId,
  createdBy,
  status = 'open',
  maxSubmissions,
  approveSubmitters = false,
  title = 'Example',
  rewardToken = 'ETH',
  rewardAmount = 1,
  chainId = 1,
  bountyPermissions = {},
  pagePermissions = [],
  page = {},
  type = 'bounty',
  id,
  allowMultipleApplications
}: Pick<Bounty, 'createdBy' | 'spaceId'> &
  Partial<
    Pick<
      Bounty,
      | 'id'
      | 'proposalId'
      | 'maxSubmissions'
      | 'chainId'
      | 'rewardAmount'
      | 'rewardToken'
      | 'status'
      | 'approveSubmitters'
      | 'allowMultipleApplications'
    >
  > &
  Partial<Pick<Page, 'title' | 'content' | 'contentText' | 'type'>> & {
    bountyPermissions?: Partial<BountyPermissions>;
    pagePermissions?: Omit<Prisma.PagePermissionCreateManyInput, 'pageId'>[];
    page?: Partial<Pick<Page, 'deletedAt'>>;
  }): Promise<Bounty & { applications: ApplicationMeta[] }> {
  const pageId = id ?? v4();

  const bountyPermissionsToAssign: Omit<Prisma.BountyPermissionCreateManyInput, 'bountyId'>[] = typedKeys(
    bountyPermissions
  ).reduce((createManyInputs, permissionLevel) => {
    const permissions = bountyPermissions[permissionLevel] as TargetPermissionGroup[];

    permissions.forEach((p) => {
      createManyInputs.push({
        permissionLevel,
        userId: p.group === 'user' ? p.id : undefined,
        roleId: p.group === 'role' ? p.id : undefined,
        spaceId: p.group === 'space' ? p.id : undefined,
        public: p.group === 'public' ? true : undefined
      });
    });

    createManyInputs.push({
      permissionLevel
    });

    return createManyInputs;
  }, [] as Omit<Prisma.BountyPermissionCreateManyInput, 'bountyId'>[]);

  await prisma.$transaction([
    // Step 1 - Initialise bounty with page and bounty permissions
    prisma.bounty.create({
      data: {
        id: pageId,
        createdBy,
        allowMultipleApplications,
        chainId,
        proposalId,
        rewardAmount,
        rewardToken,
        status,
        spaceId,
        approveSubmitters,
        maxSubmissions,
        page: {
          create: {
            id: pageId,
            createdBy,
            contentText,
            content: content ?? undefined,
            path: getPagePath(),
            title: title || 'Root',
            type,
            updatedBy: createdBy,
            spaceId,
            deletedAt: page?.deletedAt ?? undefined
          }
        },
        permissions: {
          createMany: {
            data: bountyPermissionsToAssign
          }
        }
      }
    }),
    // Step 2 populate the page permissions
    prisma.pagePermission.createMany({
      data: pagePermissions.map((p) => {
        return {
          ...p,
          pageId
        };
      })
    })
  ]);

  return getRewardOrThrow({ rewardId: pageId });
}

export async function generateComment({
  content,
  pageId,
  spaceId,
  userId,
  context = '',
  resolved = false
}: Pick<Thread, 'userId' | 'spaceId' | 'pageId'> &
  Partial<Pick<Thread, 'context' | 'resolved'>> &
  Pick<Comment, 'content'>): Promise<Comment> {
  const thread = await prisma.thread.create({
    data: {
      context,
      pageId,
      spaceId,
      userId,
      resolved,
      comments: {
        create: {
          userId,
          content: content ?? '',
          pageId,
          spaceId
        }
      }
    },
    select: {
      comments: true
    }
  });
  return thread.comments?.[0];
}

export async function generateThread(props: {
  thread: Partial<Thread> & { comments: Partial<Comment>[] };
}): Promise<{ comments: Comment[] }> {
  const { thread } = props;
  const { pageId = v4(), spaceId = v4(), userId = v4(), context = '', resolved = false, comments } = thread;

  const createdThread = await prisma.thread.create({
    data: {
      context,
      pageId,
      spaceId,
      userId,
      resolved,
      comments: {
        createMany: {
          data: comments
            .filter((item): item is Comment => !!item && !!item.content)
            .map((item) => ({
              ...item,
              content: item.content ?? '',
              userId: item.userId,
              pageId: item.pageId,
              spaceId: item.spaceId
            }))
        }
      }
    },
    select: {
      comments: true
    }
  });

  return createdThread;
}

export function generateTransaction({
  applicationId,
  chainId = '4',
  transactionId = '123'
}: { applicationId: string } & Partial<Transaction>): Promise<Transaction> {
  return prisma.transaction.create({
    data: {
      chainId,
      transactionId,
      application: {
        connect: {
          id: applicationId
        }
      }
    }
  });
}

export async function generateBountyWithSingleApplication({
  applicationStatus,
  bountyCap,
  userId,
  spaceId,
  bountyStatus,
  bountyTitle = 'Bounty',
  bountyDescription = 'Bounty description',
  customReward,
  deletedAt
}: {
  customReward?: string;
  applicationStatus: ApplicationStatus;
  bountyCap: number | null;
  userId: string;
  spaceId: string;
  bountyStatus?: BountyStatus;
  // This should be deleted on future PR. Left for backwards compatibility for now
  reviewer?: string;
  bountyTitle?: string;
  bountyDescription?: string;
  deletedAt?: Date | null;
}): Promise<Bounty & { applications: Application[]; page: Page }> {
  const createdBounty = (await prisma.bounty.create({
    data: {
      createdBy: userId,
      chainId: customReward ? null : 1,
      rewardAmount: customReward ? null : 1,
      rewardToken: customReward ? null : 'ETH',
      customReward,
      status: bountyStatus ?? 'open',
      spaceId,
      approveSubmitters: false,
      // Important variable
      maxSubmissions: bountyCap,
      page: {
        create: {
          title: bountyTitle,
          path: `bounty-${randomUUID()}`,
          type: 'bounty',
          updatedBy: userId,
          deletedAt,
          space: { connect: { id: spaceId } },
          author: { connect: { id: userId } },
          contentText: bountyDescription,
          content: {
            type: 'doc',
            content: bountyDescription
              ? [
                  {
                    type: 'paragraph',
                    content: [
                      {
                        text: bountyDescription,
                        type: 'text'
                      }
                    ]
                  }
                ]
              : []
          }
        }
      }
    },
    include: {
      applications: true,
      page: true
    }
  })) as Bounty & { page: Page; applications: Application[] };

  const user = await prisma.user.findUnique({ where: { id: userId }, include: { wallets: true } });

  const createdApp = await generateBountyApplication({
    applicationStatus,
    bountyId: createdBounty.id,
    spaceId,
    userId,
    walletAddress: user?.wallets[0]?.address
  });

  createdBounty.applications = [createdApp];

  return createdBounty;
}

export async function generateBountyApplication({
  applicationStatus,
  bountyId,
  spaceId,
  userId,
  walletAddress
}: {
  spaceId: string;
  userId: string;
  bountyId: string;
  applicationStatus: ApplicationStatus;
  walletAddress?: string;
}) {
  const createdApplication = await prisma.application.create({
    data: {
      spaceId,
      applicant: {
        connect: {
          id: userId
        }
      },
      bounty: {
        connect: {
          id: bountyId
        }
      },
      walletAddress,
      message: 'I can do this!',
      // Other important variable
      status: applicationStatus
    }
  });

  return createdApplication;
}

/**
 * @roleName uses UUID to ensure role names do not conflict
 */
export async function generateRole({
  externalId,
  spaceId,
  createdBy,
  roleName = `role-${v4()}`,
  source,
  assigneeUserIds
}: {
  externalId?: string;
  spaceId: string;
  roleName?: string;
  createdBy: string;
  source?: RoleSource;
  id?: string;
  assigneeUserIds?: string[];
}): Promise<Role> {
  const assignUsers = assigneeUserIds && assigneeUserIds.length >= 1;

  const roleAssignees: Omit<Prisma.SpaceRoleToRoleCreateManyInput, 'roleId'>[] = [];

  // check assignees
  if (assignUsers) {
    const uniqueIds = uniqueValues(assigneeUserIds);

    const spaceRoles = await prisma.spaceRole.findMany({
      where: {
        spaceId,
        userId: {
          in: uniqueIds
        }
      }
    });

    if (spaceRoles.length !== uniqueIds.length) {
      throw new InvalidInputError(`Cannot assign role to a user not inside the space`);
    }

    roleAssignees.push(...spaceRoles.map((sr) => ({ spaceRoleId: sr.id })));
  }

  const role = await prisma.role.create({
    data: {
      externalId,
      name: roleName,
      createdBy,
      space: {
        connect: {
          id: spaceId
        }
      },
      source,
      spaceRolesToRole:
        roleAssignees.length > 0
          ? {
              createMany: {
                data: roleAssignees
              }
            }
          : undefined
    }
  });

  return role;
}

export async function generateRoleWithSpaceRole({
  spaceRoleId,
  spaceId,
  createdBy
}: {
  spaceRoleId: string;
  createdBy: string;
  spaceId: string;
}) {
  const role = await generateRole({ spaceId, createdBy });

  const spaceRoleToRole = await prisma.spaceRoleToRole.create({
    data: {
      spaceRoleId,
      roleId: role.id
    }
  });

  return {
    role,
    spaceRoleToRole
  };
}

export function createPage(
  options: Partial<Page> &
    Pick<Page, 'spaceId' | 'createdBy'> & { pagePermissions?: Prisma.PagePermissionCreateManyPageInput[] }
): Promise<PageWithPermissions> {
  return createPageDb({
    data: {
      id: options.id ?? v4(),
      contentText: options.contentText ?? '',
      index: options.index,
      path: options.path ?? getPagePath(),
      title: options.title || 'Example',
      type: options.type ?? 'page',
      updatedBy: options.createdBy,
      content: options.content as Prisma.InputJsonObject,
      author: {
        connect: {
          id: options.createdBy
        }
      },
      space: {
        connect: {
          id: options.spaceId as string
        }
      },
      permissions: options.pagePermissions
        ? {
            createMany: {
              data: options.pagePermissions
            }
          }
        : undefined,
      parentId: options.parentId,
      deletedAt: options.deletedAt ?? null,
      boardId: options.boardId ?? null,
      additionalPaths: options.additionalPaths
    },
    include: {
      permissions: {
        include: {
          sourcePermission: true
        }
      }
    }
  }) as Promise<PageWithPermissions>;
}

export async function createVote({
  userVotes = [],
  voteOptions = [],
  spaceId,
  createdBy,
  pageId,
  postId,
  deadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  status = 'InProgress',
  title = 'Vote Title',
  context = 'inline',
  content,
  contentText = null,
  maxChoices = 1
}: Partial<Vote> &
  Pick<Vote, 'spaceId' | 'createdBy'> & {
    pageId?: string | null;
    postId?: string | null;
    voteOptions?: string[];
    userVotes?: string[];
  }) {
  return prisma.vote.create({
    data: {
      deadline,
      status,
      threshold: 50,
      title,
      context,
      author: {
        connect: {
          id: createdBy
        }
      },
      page: pageId
        ? {
            connect: {
              id: pageId
            }
          }
        : undefined,
      post: postId
        ? {
            connect: {
              id: postId
            }
          }
        : undefined,
      space: {
        connect: {
          id: spaceId
        }
      },
      voteOptions: {
        createMany: {
          data: voteOptions.map((voteOption) => ({
            name: voteOption
          }))
        }
      },
      userVotes: {
        createMany: {
          data: userVotes.map((userVote) => ({
            choices: [userVote],
            userId: createdBy
          }))
        }
      },
      type: 'Approval',
      content: content ?? Prisma.DbNull,
      contentText,
      maxChoices
    },
    include: {
      voteOptions: true
    }
  });
}

export async function generateCommentWithThreadAndPage({
  userId,
  spaceId,
  commentContent
}: {
  userId: string;
  spaceId: string;
  commentContent: string;
}): Promise<{ page: Page; thread: Thread; comment: Comment }> {
  const page = await createPage({
    createdBy: userId,
    spaceId
  });

  const thread = await prisma.thread.create({
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

export function createBlock(options: Partial<Block> & Pick<Block, 'createdBy' | 'rootId'>): Promise<Block> {
  return prisma.block.create({
    data: {
      title: options.title || 'Example',
      type: options.type ?? 'card',
      user: {
        connect: {
          id: options.createdBy
        }
      },
      updatedBy: options.createdBy,
      space: {
        connect: {
          id: options.spaceId as string
        }
      },
      rootId: options.rootId,
      deletedAt: options.deletedAt ?? null,
      fields: options.fields ?? {},
      parentId: options.parentId || options.rootId,
      schema: 0,
      id: options.id ?? v4()
    }
  });
}

type PageWithProposal = Page & { proposal: ProposalWithUsersAndRubric };

/**
 * Creates a proposal with the linked authors and reviewers
 */
export async function generateProposal({
  userId,
  spaceId,
  pageType = 'proposal',
  proposalStatus,
  authors,
  deletedAt = null,
  title = 'Proposal'
}: {
  deletedAt?: Page['deletedAt'];
  userId: string;
  spaceId: string;
  authors: string[];
  pageType?: PageType;
  proposalStatus: ProposalStatus;
  title?: string;
}): Promise<PageWithProposal> {
  const proposalId = v4();

  const result = await createPageDb({
    data: {
      id: proposalId,
      contentText: '',
      content: {
        type: 'doc',
        content: []
      },
      path: `path-${v4()}`,
      title,
      type: pageType,
      author: {
        connect: {
          id: userId
        }
      },
      updatedBy: userId,
      space: {
        connect: {
          id: spaceId
        }
      },
      deletedAt,
      proposal: {
        create: {
          id: proposalId,
          createdBy: userId,
          status: proposalStatus,
          space: {
            connect: {
              id: spaceId
            }
          },
          authors: {
            createMany: {
              data: authors.map((authorId) => ({ userId: authorId }))
            }
          }
        }
      }
    },
    include: {
      proposal: {
        include: {
          authors: true,
          reviewers: true
        }
      }
    }
  });

  return result as PageWithProposal;
}

/**
 * Generate a board with default properties of title, date, and a single select field
 * @param linkedSourceId - Used for providing a linked source for the boards views
 * @returns
 */
export async function generateBoard({
  createdBy,
  spaceId,
  parentId,
  cardCount,
  boardTitle,
  views,
  viewType,
  addPageContent,
  viewDataSource,
  boardPageType,
  linkedSourceId,
  customProps,
  deletedAt,
  permissions
}: {
  createdBy: string;
  spaceId: string;
  parentId?: string;
  cardCount?: number;
  boardTitle?: string;
  views?: number;
  viewType?: IViewType;
  viewDataSource?: DataSourceType;
  addPageContent?: boolean;
  boardPageType?: Extract<PageType, 'board' | 'inline_board' | 'inline_linked_board' | 'linked_board'>;
  linkedSourceId?: string;
  customProps?: Partial<CustomBoardProps>;
  deletedAt?: null | Date;
  permissions?: (Pick<PagePermission, 'permissionLevel'> &
    Partial<Pick<PagePermission, 'roleId' | 'userId' | 'spaceId' | 'public' | 'allowDiscovery'>>)[];
}): Promise<Page> {
  const { pageArgs, blockArgs } = boardWithCardsArgs({
    createdBy,
    spaceId,
    parentId,
    cardCount,
    views,
    boardTitle,
    addPageContent,
    viewDataSource,
    boardPageType,
    viewType,
    linkedSourceId,
    customProps,
    deletedAt
  });

  const permissionCreateArgs: Prisma.PagePermissionCreateManyInput[] = [];

  pageArgs.forEach((createArg) => {
    if (permissions) {
      permissionCreateArgs.push(
        ...permissions.map(
          (p) =>
            ({
              pageId: createArg.data.id as string,
              permissionLevel: p.permissionLevel,
              allowDiscovery: p.allowDiscovery,
              public: p.public,
              roleId: p.roleId,
              spaceId: p.spaceId,
              userId: p.userId
            } as Prisma.PagePermissionCreateManyInput)
        )
      );
    } else {
      permissionCreateArgs.push({
        pageId: createArg.data.id as string,
        permissionLevel: 'full_access' as const,
        userId: createdBy
      });
    }
  });

  const permissionsToCreate = prisma.pagePermission.createMany({
    data: permissionCreateArgs as any
  });
  return prisma
    .$transaction([...pageArgs.map((p) => createPageDb(p)), prisma.block.createMany(blockArgs), permissionsToCreate])
    .then((result) => result[0] as Page);
}

export async function generateForumComment({
  postId,
  createdBy,
  contentText,
  parentId
}: Pick<PostComment, 'contentText' | 'postId' | 'createdBy' | 'parentId'>): Promise<PostComment> {
  const comment = await prisma.postComment.create({
    data: {
      createdAt: new Date(),
      createdBy,
      content: {},
      contentText,
      updatedAt: new Date(),
      deletedAt: null,
      parentId,
      postId
    }
  });
  return comment;
}

export async function createPost(
  options: Partial<Post> & { categoryId: string; createdBy: string } & {
    pagePermissions?: Prisma.PagePermissionCreateManyPageInput[];
  }
): Promise<Post> {
  const forumPost = await prisma.post.create({
    data: {
      createdAt: options.createdAt || new Date(),
      updatedAt: options.updatedAt || new Date(),
      deletedAt: options.deletedAt,
      id: options.id,
      title: options.title || 'New Forum Post',
      content: options.content || {},
      contentText: options.contentText || 'Some text in the forum',
      path: options.path || getPagePath(),
      categoryId: options.categoryId,
      createdBy: options.createdBy,
      spaceId: options.spaceId || v4(),
      pinned: options.pinned ?? false,
      locked: options.locked ?? false
    }
  });
  return forumPost;
}

export async function generateApplicationComment({
  userId,
  applicationId,
  bountyId
}: {
  bountyId: string;
  applicationId: string;
  userId: string;
}) {
  return prisma.pageComment.create({
    data: {
      content: emptyDocument,
      contentText: '',
      createdBy: userId,
      parentId: applicationId,
      pageId: bountyId
    }
  });
}
