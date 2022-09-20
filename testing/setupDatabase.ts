import type { ApplicationStatus, Block, Bounty, BountyStatus, Comment, Page, Prisma, ProposalStatus, Role, RoleSource, Thread, Transaction, Vote } from '@prisma/client';
import { prisma } from 'db';
import { getBountyOrThrow } from 'lib/bounties/getBounty';
import { provisionApiKey } from 'lib/middleware/requireApiKey';
import { getPagePath, IPageWithPermissions, PageWithProposal } from 'lib/pages';
import { BountyPermissions } from 'lib/permissions/bounties';
import { TargetPermissionGroup } from 'lib/permissions/interfaces';
import { ProposalReviewerInput } from 'lib/proposal/interface';
import { syncProposalPermissions } from 'lib/proposal/syncProposalPermissions';
import { createUserFromWallet } from 'lib/users/createUser';
import { typedKeys } from 'lib/utilities/objects';
import { BountyWithDetails, IDENTITY_TYPES, LoggedInUser } from 'models';
import { v4 } from 'uuid';
import { boardWithCardsArgs } from './generate-board-stub';

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
export async function generateUserAndSpaceWithApiToken (walletAddress: string = v4(), isAdmin = true) {
  const user = await createUserFromWallet(walletAddress);

  const existingSpaceId = user.spaceRoles?.[0]?.spaceId;

  let space = null;

  if (existingSpaceId) {
    space = await prisma.space.findUnique({ where: { id: user.spaceRoles?.[0]?.spaceId }, include: { apiToken: true, spaceRoles: true } });
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
        apiToken: true,
        spaceRoles: true
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

export async function generateBounty ({ content = undefined, contentText = '', spaceId, createdBy, status, maxSubmissions, approveSubmitters, title = 'Example', rewardToken = 'ETH', rewardAmount = 1, chainId = 1, bountyPermissions = {}, pagePermissions = [], page = {}, type = 'bounty', id }: Pick<Bounty, 'createdBy' | 'spaceId' | 'status' | 'approveSubmitters'> & Partial<Pick<Bounty, 'id' | 'maxSubmissions' | 'chainId' | 'rewardAmount' | 'rewardToken'>> & Partial<Pick<Page, 'title' | 'content' | 'contentText' | 'type'>> & {bountyPermissions?: Partial<BountyPermissions>, pagePermissions?: Omit<Prisma.PagePermissionCreateManyInput, 'pageId'>[], page?: Partial<Pick<Page, 'deletedAt'>>}): Promise<BountyWithDetails> {

  const pageId = id ?? v4();

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
        id: pageId,
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
      data: pagePermissions.map(p => {
        return {
          ...p,
          pageId
        };
      })
    })
  ]);

  return getBountyOrThrow(pageId);
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

export async function generateRoleWithSpaceRole ({ spaceRoleId, spaceId, createdBy }: { spaceRoleId: string, createdBy: string, spaceId: string}) {
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

export function createPage (options: Partial<Page> & Pick<Page, 'spaceId' | 'createdBy'> & {pagePermissions?: Prisma.PagePermissionCreateManyPageInput[]}): Promise<IPageWithPermissions> {
  return prisma.page.create({
    data: {
      id: options.id ?? v4(),
      contentText: options.contentText ?? '',
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
      permissions: options.pagePermissions ? {
        createMany: {
          data: options.pagePermissions
        }
      } : undefined,
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
  }) as Promise<IPageWithPermissions>;
}

export async function createVote ({ userVotes = [], voteOptions = [], spaceId, createdBy, pageId, deadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), status = 'InProgress', title = 'Vote Title', context = 'inline', description = null }: Partial<Vote> & Pick<Vote, 'spaceId' | 'createdBy' | 'pageId'> & {voteOptions?: string[], userVotes?: string[]}) {
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

export async function createProposalWithUsers ({ proposalStatus = 'private_draft', authors, reviewers, userId, spaceId, ...pageCreateInput }: {
  authors: string[],
  reviewers: (string | {type: 'role', roleId: string})[],
  spaceId: string,
  userId: string,
  proposalStatus?: ProposalStatus
} & Partial<Prisma.PageCreateInput>): Promise<PageWithProposal> {
  const proposalId = v4();

  const proposalPage = await prisma.page.create({
    data: {
      ...pageCreateInput,
      id: proposalId,
      author: {
        connect: {
          id: userId
        }
      },
      space: {
        connect: {
          id: spaceId
        }
      },
      updatedBy: userId,
      title: 'Page Title',
      path: 'page-path',
      contentText: '',
      type: 'proposal',
      proposal: {
        create: {
          id: proposalId,
          space: {
            connect: {
              id: spaceId
            }
          },
          createdBy: userId,
          status: proposalStatus,
          authors: {
            createMany: {
              data: [{
                userId
              }, ...authors.map(author => ({ userId: author }))]
            }
          },
          reviewers: {
            createMany: {
              data: reviewers.map(reviewer => typeof reviewer === 'string' ? ({ userId: reviewer }) : ({ roleId: reviewer.roleId }))
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

  // proposal authors will have full_access to the page
  await syncProposalPermissions({ proposalId });

  return proposalPage;
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

/**
 * Creates a proposal with the linked authors and reviewers
 */
export async function generateProposal ({ userId, spaceId, proposalStatus, authors, reviewers, deletedAt = null }:
  {deletedAt?: Page['deletedAt'], userId: string, spaceId: string, authors: string[], reviewers: ProposalReviewerInput[], proposalStatus: ProposalStatus}):
  Promise<PageWithProposal> {
  const proposalId = v4();

  return prisma.page.create({
    data: {
      id: proposalId,
      contentText: '',
      path: `path-${v4()}`,
      title: 'Proposal',
      type: 'proposal',
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
              data: authors.map(authorId => ({ userId: authorId }))
            }
          },
          reviewers: {
            createMany: {
              data: (reviewers ?? []).map(r => {
                return {
                  userId: r.group === 'user' ? r.id : undefined,
                  roleId: r.group === 'role' ? r.id : undefined
                };
              })
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
}

export async function generateBoard ({ createdBy, spaceId, parentId }: {createdBy: string, spaceId: string, parentId?: string}): Promise<Page> {

  const { pageArgs, blockArgs } = boardWithCardsArgs({ createdBy, spaceId, parentId });

  return prisma.$transaction([
    ...pageArgs.map(p => prisma.page.create(p)),
    prisma.block.createMany(blockArgs)
  ]).then(result => result[0] as Page);

}
