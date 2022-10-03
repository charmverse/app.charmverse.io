import type { Page as BrowserPage } from '@playwright/test';
import type { Bounty, Page, Prisma, Space } from '@prisma/client';
import { prisma } from 'db';
import { getBountyOrThrow } from 'lib/bounties/getBounty';
import type { BountyPermissions, BountyWithDetails } from 'lib/bounties';
import type { IPageWithPermissions } from 'lib/pages/interfaces';
import { getPagePath } from 'lib/pages/utils';
import type { TargetPermissionGroup } from 'lib/permissions/interfaces';
import { createUserFromWallet } from 'lib/users/createUser';
import { typedKeys } from 'lib/utilities/objects';
import type { LoggedInUser } from 'models';
import { baseUrl } from 'testing/mockApiCall';
import { v4 } from 'uuid';
import { Wallet } from 'ethers';
import { readFileSync } from 'fs';
import { createPage } from 'testing/setupDatabase';
import type { AuthSig } from 'lib/blockchain/interfaces';

export { baseUrl } from 'testing/mockApiCall';

export async function mockAuthSig ({ address, page }: { address: string, page: BrowserPage }): Promise<AuthSig> {

  await page.waitForURL(baseUrl);

  const authSig = {
    address,
    derivedVia: 'charmverse-mock',
    sig: 'signature',
    signedMessage: 'signed message'
  };

  // Approach to setting localstorage found here https://github.com/microsoft/playwright/issues/6258#issuecomment-824314544
  await page.evaluate(`window.localStorage.setItem('charm.v1.wallet-auth-sig-${address}', '${JSON.stringify(authSig)}')`);

  return authSig;
}

export async function createUser ({ browserPage, walletAddress }: { browserPage: BrowserPage;
  walletAddress: string; }): Promise<LoggedInUser> {

  return browserPage.request.post(`${baseUrl}/api/profile/dev`, {
    data: {
      address: walletAddress
    }
  }).then(res => res.json());
}

export async function createSpace ({ browserPage, createdBy, permissionConfigurationMode }: { browserPage: BrowserPage } & Pick<Space, 'createdBy'> & Partial<Pick<Space, 'permissionConfigurationMode'>>): Promise<Space> {
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

export async function getPages ({ browserPage, spaceId }: { browserPage: BrowserPage, spaceId: string }): Promise<IPageWithPermissions[]> {
  return browserPage.request.get(`${baseUrl}/api/spaces/${spaceId}/pages`).then(res => res.json());
}

/**
 * @browserPage - the page object for the browser context that will execute the requests
 *
 * Returns a user and space along with this space's pages
 */
export async function createUserAndSpace ({
  browserPage,
  walletAddress = Wallet.createRandom().address,
  permissionConfigurationMode = 'collaborative'
}: {
  browserPage: BrowserPage;
  walletAddress?: string;
} & Partial<Pick<Space, 'permissionConfigurationMode'>>): Promise<{ user: LoggedInUser, walletAddress?: string, space: Space, pages: IPageWithPermissions[] }> {
  const user = await createUser({ browserPage, walletAddress });
  const space = await createSpace({ browserPage, createdBy: user.id, permissionConfigurationMode });
  const pages = await getPages({ browserPage, spaceId: space.id });

  return {
    space,
    walletAddress,
    user,
    pages
  };
}

export async function generateBounty ({ content = undefined, contentText = '', spaceId, createdBy, status, maxSubmissions, approveSubmitters, title = 'Example', rewardToken = 'ETH', rewardAmount = 1, chainId = 1, bountyPermissions = {}, pagePermissions = [], page = {}, type = 'bounty', id }: Pick<Bounty, 'createdBy' | 'spaceId' | 'status' | 'approveSubmitters'> & Partial<Pick<Bounty, 'id' | 'maxSubmissions' | 'chainId' | 'rewardAmount' | 'rewardToken'>> & Partial<Pick<Page, 'title' | 'content' | 'contentText' | 'type'>> & { bountyPermissions?: Partial<BountyPermissions>, pagePermissions?: Omit<Prisma.PagePermissionCreateManyInput, 'pageId'>[], page?: Partial<Pick<Page, 'deletedAt'>> }): Promise<BountyWithDetails> {

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

interface CreateUserAndSpaceOptions {
  walletAddress?: string;
  isAdmin?: boolean;
}
export async function generateUserAndSpace ({ isAdmin, walletAddress = Wallet.createRandom().address }: CreateUserAndSpaceOptions = {}) {
  const user = await createUserFromWallet(walletAddress);

  const existingSpaceId = user.spaceRoles?.[0]?.spaceId;

  let space: Space;

  if (existingSpaceId) {
    space = await prisma.space.findUniqueOrThrow({ where: { id: user.spaceRoles?.[0]?.spaceId }, include: { apiToken: true, spaceRoles: true } });
  }
  else {
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
      }
    });
  }

  const page = await createPage({
    spaceId: space.id,
    createdBy: user.id,
    title: 'Test Page',
    pagePermissions: [{
      spaceId: space.id,
      permissionLevel: 'full_access'
    }]
  });

  return {
    page,
    user,
    space,
    walletAddress
  };
}

// load web3 mock library https:// massimilianomirra.com/notes/mocking-window-ethereum-in-playwright-for-end-to-end-dapp-testing
// optionally pass in a context object to be available to the callback
export async function mockWeb3<T> (page: BrowserPage, context: T | ((context: T) => void), callback?: (context: T) => void) {
  callback ||= context as (context: T) => void;
  context = typeof context === 'function' ? {} as T : context;

  await page.addInitScript({
    content:
      `${readFileSync(
        require.resolve('@depay/web3-mock/dist/umd/index.bundle.js'),
        'utf-8'
      )}\n`
      + `

        Web3Mock.mock('ethereum');

        // mock deprecatd apis not handled by web3-mock
        window.ethereum.enable = () => Promise.resolve();

        window.ethereum.send = (method, opts) => {
          return window.ethereum.request({ method }, opts);
        };



      `
      + `(${callback.toString()})(${JSON.stringify(context)});`
  });
}
