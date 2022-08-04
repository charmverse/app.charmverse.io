import { ApplicationStatus, Block, Bounty, BountyStatus, Comment, Page, Prisma, Role, RoleSource, Space, SpaceApiToken, Thread, Transaction, Vote } from '@prisma/client';
import { prisma } from 'db';
import { getBountyOrThrow } from 'lib/bounties';
import { provisionApiKey } from 'lib/middleware/requireApiKey';
import { IPageWithPermissions } from 'lib/pages';
import { BountyPermissions } from 'lib/permissions/bounties';
import { TargetPermissionGroup } from 'lib/permissions/interfaces';
import { createUserFromWallet } from 'lib/users/createUser';
import { typedKeys } from 'lib/utilities/objects';
import { BountyWithDetails, IDENTITY_TYPES, LoggedInUser } from 'models';
import { v4 } from 'uuid';

export async function generateSpaceUser ({ spaceId, isAdmin }: { spaceId: string, isAdmin: boolean }): Promise<LoggedInUser> {
  return prisma.user.create({
    data: {
      addresses: [v4()],
      identityType: IDENTITY_TYPES[1],
      username: 'Username',
      spaceRoles: {
        create: {
          space: {
            connect: {
              id: spaceId
            }
          },
          isAdmin
        }
      }
    },
    include: {
      favorites: true,
      spaceRoles: {
        include: {
          spaceRoleToRole: {
            include: {
              role: true
            }
          }
        }
      }
    }
  });
}

/**
 * Simple utility to provide a user and space object inside test code
 * @param walletAddress
 * @returns
 */
export async function generateUserAndSpaceWithApiToken (walletAddress: string = v4(), isAdmin = true): Promise<{
  user: LoggedInUser,
  space: Space,
  apiToken: SpaceApiToken
}> {
  const user = await createUserFromWallet(walletAddress);

  const existingSpaceId = user.spaceRoles?.[0]?.spaceId;

  let space: Space | null = null;

  if (existingSpaceId) {
    space = await prisma.space.findUnique({ where: { id: user.spaceRoles?.[0]?.spaceId }, include: { apiToken: true } });
  }

  if (!space) {
    space = await prisma.space.create({
      data: {
        name: 'Example space',
        // Adding prefix avoids this being evaluated as uuid
        domain: `domain-${v4()}`,
        author: {
          connect: {
            id: user.id
          }
        },
        updatedBy: user.id,
        updatedAt: (new Date()).toISOString(),
        spaceRoles: {
          create: {
            userId: user.id,
            isAdmin
          }
        }
      },
      include: {
        apiToken: true
      }
    });
  }

  const apiToken = (space as any).apiToken ?? await provisionApiKey(space.id);

  return {
    user,
    space,
    apiToken
  };
}

export async function generateBounty ({ content = undefined, contentText = '', spaceId, createdBy, status, maxSubmissions, approveSubmitters, title = 'Example', rewardToken = 'ETH', rewardAmount = 1, chainId = 1, bountyPermissions = {}, pagePermissions = [], page = {} }: Pick<Bounty, 'createdBy' | 'spaceId' | 'status' | 'approveSubmitters'> & Partial<Pick<Bounty, 'maxSubmissions' | 'chainId' | 'rewardAmount' | 'rewardToken'>> & Partial<Pick<Page, 'title' | 'content' | 'contentText'>> & {bountyPermissions?: Partial<BountyPermissions>, pagePermissions?: Omit<Prisma.PagePermissionCreateManyInput, 'pageId'>[], page?: Partial<Pick<Page, 'deletedAt'>>}): Promise<BountyWithDetails> {

  const pageId = v4();
  const bountyId = v4();

  const bountyPermissionsToAssign: Omit<Prisma.BountyPermissionCreateManyInput, 'bountyId'>[] = typedKeys(bountyPermissions).reduce((createManyInputs, permissionLevel) => {

    const permissions = bountyPermissions[permissionLevel] as TargetPermissionGroup[];

    permissions.forEach(p => {
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
        id: bountyId,
        createdBy,
        chainId,
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
            path: `page-${pageId}`,
            title: title || 'Root',
            type: 'bounty',
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
      data: pagePermissions.map(p => {
        return {
          ...p,
          pageId
        };
      })
    })
  ]);

  return getBountyOrThrow(bountyId);
}

export async function generateComment ({ content, pageId, spaceId, userId, context = '', resolved = false }: Pick<Thread, 'userId' | 'spaceId' | 'pageId'> & Partial<Pick<Thread, 'context' | 'resolved'>> & Pick<Comment, 'content'>): Promise<Comment> {
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

export function generateTransaction ({ applicationId, chainId = '4', transactionId = '123' }: {applicationId: string} & Partial<Transaction>): Promise<Transaction> {
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

export async function generateBountyWithSingleApplication ({ applicationStatus, bountyCap, userId, spaceId, bountyStatus }:
  {applicationStatus: ApplicationStatus, bountyCap: number | null, userId: string, spaceId: string, bountyStatus?: BountyStatus,
    // This should be deleted on future PR. Left for backwards compatibility for now
    reviewer?: string}):
  Promise<BountyWithDetails> {
  const createdBounty = await prisma.bounty.create({
    data: {
      createdBy: userId,
      chainId: 1,
      rewardAmount: 1,
      rewardToken: 'ETH',
      status: bountyStatus ?? 'open',
      spaceId,
      approveSubmitters: false,
      // Important variable
      maxSubmissions: bountyCap
    },
    include: {
      applications: true
    }
  }) as BountyWithDetails;

  const user = await prisma.user.findUnique({ where: { id: userId } });

  const createdApp = await prisma.application.create({
    data: {
      spaceId,
      applicant: {
        connect: {
          id: userId
        }
      },
      bounty: {
        connect: {
          id: createdBounty.id
        }
      },
      walletAddress: user?.addresses?.[0],
      message: 'I can do this!',
      // Other important variable
      status: applicationStatus
    }
  });

  createdBounty.applications = [createdApp];

  return createdBounty;
}

/**
 * @roleName uses UUID to ensure role names do not conflict
 */
export async function generateRole ({ spaceId, createdBy, roleName = `role-${v4()}`, source }: {spaceId: string, roleName?: string, createdBy: string, source?: RoleSource}): Promise<Role> {
  const role = await prisma.role.create({
    data: {
      name: roleName,
      createdBy,
      space: {
        connect: {
          id: spaceId
        }
      },
      source
    }
  });

  return role;
}

export function createPage (options: Partial<Page> & Pick<Page, 'spaceId' | 'createdBy'>): Promise<IPageWithPermissions> {
  return prisma.page.create({
    data: {
      id: options.id ?? v4(),
      contentText: options.contentText ?? '',
      path: options.path ?? `page-${v4()}`,
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
      parentId: options.parentId,
      deletedAt: options.deletedAt ?? null,
      boardId: options.boardId ?? null
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

export async function createVote ({ userVotes = [], voteOptions = [], spaceId, createdBy, pageId, deadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), status = 'InProgress', title = 'Vote Title', description = null }: Partial<Vote> & Pick<Vote, 'spaceId' | 'createdBy' | 'pageId'> & {voteOptions?: string[], userVotes?: string[]}) {
  return prisma.vote.create({
    data: {
      deadline,
      status,
      threshold: 50,
      title,
      author: {
        connect: {
          id: createdBy
        }
      },
      page: {
        connect: {
          id: pageId
        }
      },
      space: {
        connect: {
          id: spaceId
        }
      },
      voteOptions: {
        createMany: {
          data: voteOptions.map(voteOption => ({
            name: voteOption
          }))
        }
      },
      userVotes: {
        createMany: {
          data: userVotes.map(userVote => ({
            choice: userVote,
            userId: createdBy
          }))
        }
      },
      type: 'Approval',
      description
    },
    include: {
      voteOptions: true
    }
  });
}

export async function generateCommentWithThreadAndPage ({ userId, spaceId, commentContent }: {
  userId: string,
  spaceId: string,
  commentContent: string
}): Promise<{page: Page, thread: Thread, comment: Comment}> {

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

export function createBlock (options: Partial<Block> & Pick<Block, 'createdBy' | 'rootId'>): Promise<Block> {
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
