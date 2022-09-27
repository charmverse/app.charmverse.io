import type { Page as BrowserPage } from '@playwright/test';
import type { Bounty, Page, Prisma, Space } from '@prisma/client';
import { prisma } from 'db';
import { getBountyOrThrow } from 'lib/bounties/getBounty';
import type { BountyPermissions, BountyWithDetails } from 'lib/bounties/interfaces';
import type { IPageWithPermissions } from 'lib/pages/interfaces';
import { getPagePath } from 'lib/pages/utils';
import type { TargetPermissionGroup } from 'lib/permissions/interfaces';
import { createUserFromWallet } from 'lib/users/createUser';
import { typedKeys } from 'lib/utilities/objects';
import type { LoggedInUser } from 'models';
import { baseUrl } from 'testing/mockApiCall';
import { v4 } from 'uuid';

export { baseUrl } from 'testing/mockApiCall';

export async function createUser ({ browserPage, walletAddress }: {browserPage: BrowserPage,
  walletAddress?: string}): Promise<LoggedInUser> {

  return browserPage.request.post(`${baseUrl}/api/profile`, {
    data: {
      address: walletAddress
    }
  }).then(res => res.json());
}

export async function createSpace ({ browserPage, createdBy, permissionConfigurationMode }: {browserPage: BrowserPage} & Pick<Space, 'createdBy'> & Partial<Pick<Space, 'permissionConfigurationMode'>>): Promise<Space> {
  return browserPage.request.post(`${baseUrl}/api/spaces`, {
    data: {
      author: {
        connect: {
          id: createdBy
        }
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      updatedBy: createdBy,
      spaceRoles: {
        create: [{
          isAdmin: true,
          user: {
            connect: {
              id: createdBy
            }
          }
        }]
      },
      permissionConfigurationMode,
      domain: `domain-${v4()}`,
      name: 'Testing space'
    }
  }).then(res => res.json());
}

export async function getPages ({ browserPage, spaceId }: {browserPage: BrowserPage, spaceId: string}): Promise<IPageWithPermissions[]> {
  return browserPage.request.get(`${baseUrl}/api/spaces/${spaceId}/pages`).then(res => res.json());
}

/**
 * @browserPage - the page object for the browser context that will execute the requests
 *
 * Returns a user and space along with this space's pages
 */
export async function createUserAndSpace ({
  browserPage,
  walletAddress = v4(),
  permissionConfigurationMode = 'collaborative'
}: {
  browserPage: BrowserPage,
  walletAddress?: string;
} & Partial<Pick<Space, 'permissionConfigurationMode'>>): Promise<{user: LoggedInUser, space: Space, pages: IPageWithPermissions[]}> {
  const user = await createUser({ browserPage, walletAddress });
  const space = await createSpace({ browserPage, createdBy: user.id, permissionConfigurationMode });
  const pages: IPageWithPermissions[] = await getPages({ browserPage, spaceId: space.id });

  return {
    space,
    user,
    pages
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

/**
 * Simple utility to provide a user and space object inside test code
 * @param walletAddress
 * @returns
 */
export async function generateUserAndSpace (walletAddress: string = v4(), isAdmin = true) {
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

  return {
    user,
    space
  };
}
