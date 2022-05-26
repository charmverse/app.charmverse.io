import { Application, ApplicationStatus, Block, Bounty, BountyStatus, Page, Prisma, Space, SpaceApiToken, Transaction } from '@prisma/client';
import { prisma } from 'db';
import { provisionApiKey } from 'lib/middleware/requireApiKey';
import { createUserFromWallet } from 'lib/users/createUser';
import { LoggedInUser } from 'models';
import { v4 } from 'uuid';
import { IPageWithPermissions } from 'lib/pages/server';

export async function generateSpaceUser ({ spaceId, isAdmin }: { spaceId: string, isAdmin: boolean }): Promise<LoggedInUser> {
  return prisma.user.create({
    data: {
      addresses: [v4()],
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
        domain: v4(),
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

export function generateBounty ({ spaceId, createdBy, status, maxSubmissions, approveSubmitters }: Pick<Bounty, 'createdBy' | 'spaceId' | 'status' | 'approveSubmitters'> & Partial<Pick<Bounty, 'maxSubmissions'>>): Promise<Bounty> {
  return prisma.bounty.create({
    data: {
      createdBy,
      chainId: 1,
      rewardAmount: 1,
      rewardToken: 'ETH',
      title: 'Example',
      status,
      spaceId,
      description: '',
      descriptionNodes: '',
      approveSubmitters,
      maxSubmissions
    }
  });
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

export function generateBountyWithSingleApplication ({ applicationStatus, bountyCap, userId, spaceId, bountyStatus, reviewer }:
  {applicationStatus: ApplicationStatus, bountyCap: number | null, userId: string, spaceId: string, bountyStatus?: BountyStatus, reviewer?: string}):
  Promise<Bounty & {applications: Application[]}> {
  return prisma.bounty.create({
    data: {
      createdBy: userId,
      chainId: 1,
      reviewer,
      rewardAmount: 1,
      rewardToken: 'ETH',
      title: 'Example',
      status: bountyStatus ?? 'open',
      spaceId,
      description: '',
      descriptionNodes: '',
      approveSubmitters: false,
      // Important variable
      maxSubmissions: bountyCap,
      applications: {
        create: {
          applicant: {
            connect: {
              id: userId
            }
          },
          message: 'I can do this!',
          // Other important variable
          status: applicationStatus
        }
      }
    },
    include: {
      applications: true
    }
  });
}

export function createPage (options: Partial<Page> & Pick<Page, 'spaceId' | 'createdBy'>): Promise<IPageWithPermissions> {
  return prisma.page.create({
    data: {
      contentText: '',
      path: options.path ?? `page-${v4()}`,
      title: options.title || 'Example',
      type: 'page',
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
      deletedAt: options.deletedAt ?? null
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

export function createBlock (options: Partial<Block> & Pick<Block, 'createdBy' | 'rootId'>): Promise<Block> {
  return prisma.block.create({
    data: {
      title: options.title || 'Example',
      type: 'card',
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
      fields: {},
      parentId: options.parentId || options.rootId,
      schema: 0,
      id: v4()
    }
  });
}

export default async function seedDatabase () {
  // Left empty as we do not need any global data for now

  return true;
}
