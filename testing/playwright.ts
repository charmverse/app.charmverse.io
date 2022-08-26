import { Space } from '@prisma/client';
import { LoggedInUser } from 'models';
import { v4 } from 'uuid';
import { Page as BrowserPage } from '@playwright/test';
import { IPageWithPermissions } from 'lib/pages/interfaces';
import { baseUrl } from './mockApiCall';

export async function createUser ({ browserPage, walletAddress }: {browserPage: BrowserPage,
  walletAddress?: string}): Promise<LoggedInUser> {
  return browserPage.request.post(`${baseUrl}/api/profile`, {
    data: {
      address: walletAddress
    }
  }).then(res => res.json());
}

export async function createSpace ({ browserPage, createdBy }: {browserPage: BrowserPage} & Pick<Space, 'createdBy'> & Partial<Pick<Space, 'permissionConfigurationMode'>>): Promise<Space> {
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
