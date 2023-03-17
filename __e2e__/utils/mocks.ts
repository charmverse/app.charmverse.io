import type { Page as BrowserPage } from '@playwright/test';
import type { Bounty, Page, Prisma, Space } from '@prisma/client';
import { Wallet } from 'ethers';
import { v4 } from 'uuid';

import { baseUrl } from 'config/constants';
import { prisma } from 'db';
import type { BountyPermissions, BountyWithDetails } from 'lib/bounties';
import { getBountyOrThrow } from 'lib/bounties/getBounty';
import type { IPageWithPermissions } from 'lib/pages/interfaces';
import { getPagePath } from 'lib/pages/utils';
import type { TargetPermissionGroup } from 'lib/permissions/interfaces';
import { createUserFromWallet } from 'lib/users/createUser';
import { typedKeys } from 'lib/utilities/objects';
import type { LoggedInUser } from 'models';
import { createPage } from 'testing/setupDatabase';

export async function createUser({
  browserPage,
  address
}: {
  browserPage: BrowserPage;
  address: string;
}): Promise<LoggedInUser> {
  return browserPage.request
    .post(`${baseUrl}/api/profile/dev`, {
      data: {
        address
      }
    })
    .then((res) => res.json());
}

export async function createSpace({
  browserPage,
  permissionConfigurationMode
}: { browserPage: BrowserPage } & Pick<Space, 'createdBy'> &
  Partial<Pick<Space, 'permissionConfigurationMode'>>): Promise<Space> {
  return browserPage.request
    .post(`${baseUrl}/api/spaces`, {
      data: {
        spaceData: {
          name: 'Testing space',
          permissionConfigurationMode
        }
      }
    })
    .then((res) => res.json());
}

export async function getPages({
  browserPage,
  spaceId
}: {
  browserPage: BrowserPage;
  spaceId: string;
}): Promise<IPageWithPermissions[]> {
  return browserPage.request.get(`${baseUrl}/api/spaces/${spaceId}/pages`).then((res) => res.json());
}

/**
 * @browserPage - the page object for the browser context that will execute the requests
 *
 * @isOnboarded Default to true so all user / space pairs start as onboarded, and the tester can focus on the happy path they are targeting
 *
 * Returns a user and space along with this space's pages
 */
export async function createUserAndSpace({
  browserPage,
  permissionConfigurationMode = 'collaborative',
  isOnboarded = true
}: {
  browserPage: BrowserPage;
} & Partial<Pick<Space, 'permissionConfigurationMode'>> & { isOnboarded?: boolean }): Promise<{
  user: LoggedInUser;
  address: string;
  privateKey: string;
  space: Space;
  pages: IPageWithPermissions[];
}> {
  const wallet = Wallet.createRandom();
  const address = wallet.address;

  const user = await createUser({ browserPage, address });
  const space = await createSpace({ browserPage, createdBy: user.id, permissionConfigurationMode });
  const pages = await getPages({ browserPage, spaceId: space.id });

  const updatedRole = await prisma.spaceRole.update({
    where: {
      spaceUser: {
        spaceId: space.id,
        userId: user.id
      }
    },
    data: {
      onboarded: isOnboarded
    },
    include: {
      spaceRoleToRole: {
        include: {
          role: true
        }
      }
    }
  });

  if (!user.spaceRoles.some((sr) => sr.id === updatedRole.id)) {
    user.spaceRoles.push(updatedRole);
  } else {
    user.spaceRoles = user.spaceRoles.map((r) => {
      if (r.id !== updatedRole.id) {
        return r;
      } else {
        return updatedRole;
      }
    });
  }

  return {
    space,
    address,
    privateKey: wallet.privateKey,
    user,
    pages
  };
}

export async function generateBounty({
  content = undefined,
  contentText = '',
  spaceId,
  createdBy,
  status,
  maxSubmissions,
  approveSubmitters,
  title = 'Example',
  rewardToken = 'ETH',
  rewardAmount = 1,
  chainId = 1,
  bountyPermissions = {},
  pagePermissions = [],
  page = {},
  type = 'bounty',
  id
}: Pick<Bounty, 'createdBy' | 'spaceId' | 'status' | 'approveSubmitters'> &
  Partial<Pick<Bounty, 'id' | 'maxSubmissions' | 'chainId' | 'rewardAmount' | 'rewardToken'>> &
  Partial<Pick<Page, 'title' | 'content' | 'contentText' | 'type'>> & {
    bountyPermissions?: Partial<BountyPermissions>;
    pagePermissions?: Omit<Prisma.PagePermissionCreateManyInput, 'pageId'>[];
    page?: Partial<Pick<Page, 'deletedAt'>>;
  }): Promise<BountyWithDetails> {
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
      data: pagePermissions.map((p) => {
        return {
          ...p,
          pageId
        };
      })
    })
  ]);

  return getBountyOrThrow(pageId);
}

export async function generateUser({ walletAddress = Wallet.createRandom().address }: { walletAddress?: string } = {}) {
  const user = await prisma.user.create({
    data: {
      identityType: 'Wallet',
      username: v4(),
      path: v4(),
      wallets: {
        create: {
          address: walletAddress
        }
      }
    }
  });

  return user;
}

export async function generateDiscordUser() {
  const user = await prisma.user.create({
    data: {
      identityType: 'Wallet',
      username: v4(),
      path: v4(),
      discordUser: {
        create: {
          account: {},
          discordId: v4()
        }
      }
    }
  });

  return user;
}

export async function generateSpaceRole({
  spaceId,
  userId,
  isAdmin = false,
  // Defaults to true so that users dont see the onboarding experience
  isOnboarded = true
}: {
  userId: string;
  spaceId: string;
  isAdmin?: boolean;
  isOnboarded?: boolean;
}) {
  return prisma.spaceRole.create({
    data: {
      isAdmin,
      space: { connect: { id: spaceId } },
      user: { connect: { id: userId } },
      onboarded: isOnboarded
    }
  });
}

type UserAndSpaceInput = {
  isAdmin?: boolean;
  onboarded?: boolean;
  spaceName?: string;
  publicBountyBoard?: boolean;
  skipOnboarding?: boolean;
  email?: string;
};

export async function generateUserAndSpace({
  isAdmin,
  spaceName = 'Example Space',
  publicBountyBoard,
  skipOnboarding = true,
  email = `${v4()}@gmail.com`
}: UserAndSpaceInput = {}) {
  const wallet = Wallet.createRandom();
  const address = wallet.address;

  const user = await createUserFromWallet({ address, email });

  const existingSpaceId = user.spaceRoles?.[0]?.spaceId;

  let space: Space;

  if (existingSpaceId) {
    space = await prisma.space.findUniqueOrThrow({
      where: { id: user.spaceRoles?.[0]?.spaceId },
      include: { apiToken: true, spaceRoles: true }
    });
  } else {
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
        publicBountyBoard,
        updatedBy: user.id,
        updatedAt: new Date().toISOString(),
        spaceRoles: {
          create: {
            userId: user.id,
            isAdmin,
            // skip onboarding for normal test users
            onboarded: skipOnboarding
          }
        }
      }
    });
  }

  const page = await createPage({
    spaceId: space.id,
    createdBy: user.id,
    title: 'Test Page',
    pagePermissions: [
      {
        spaceId: space.id,
        permissionLevel: 'full_access'
      }
    ]
  });

  return {
    page,
    user,
    space,
    address,
    privateKey: wallet.privateKey
  };
}

export type UserAndSpaceContext = Awaited<ReturnType<typeof generateUserAndSpace>>;
