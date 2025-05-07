import type { PostCategoryPermission, Space, SpaceRole, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { uid } from '@packages/utils/strings';
import { defaultPostCategories } from '@packages/lib/forums/categories/generateDefaultPostCategories';
import { v4 } from 'uuid';

import { gettingStartedPage } from 'seedData/gettingStartedPage';

import { staticSpaceTemplates } from '../config';
import type { SpaceCreateInput } from '../createSpace';
import { createWorkspace } from '../createSpace';

let user: User;

beforeAll(async () => {
  user = await prisma.user.create({
    data: {
      path: uid(),
      username: 'demo-user'
    }
  });
});

describe('createWorkspace', () => {
  it('should create a space allowing for an xpsengine and discord integration, and register the token used to create the space if one was used', async () => {
    const tokenName = `Integration partner ${uid()}`;

    const tokenValue = `key-${v4()}`;

    const superApiToken = await prisma.superApiToken.create({
      data: {
        name: tokenName,
        token: tokenValue
      }
    });

    const discordServerId = `discord-${v4()}`;
    const xpsEngineId = `xps-${v4()}`;

    const input: SpaceCreateInput = {
      discordServerId,
      xpsEngineId,
      name: 'Test space',
      spaceImage: 'https://example.com/avatar.png',
      superApiTokenId: superApiToken.id
    };

    const space = await createWorkspace({
      spaceData: input,
      userId: user.id
    });

    const spaceInDb = await prisma.space.findUnique({
      where: {
        id: space.id
      }
    });

    expect(spaceInDb).toMatchObject(expect.objectContaining<Partial<Space>>(input));
  });

  // This supports the createWorkspaceApi method which consumes this function and marks the space as updated by the bot, and created by the user
  it('should allow assigning additional users as admins on creation, and optionally mark the space as updated by a specific user', async () => {
    const tokenName = `Integration partner ${uid()}`;

    const tokenValue = `key-${v4()}`;

    const superApiToken = await prisma.superApiToken.create({
      data: {
        name: tokenName,
        token: tokenValue
      }
    });

    const bot = await prisma.user.create({
      data: {
        username: 'Bot user',
        isBot: true,
        path: uid()
      }
    });

    const input: SpaceCreateInput = {
      name: 'Test space',
      spaceImage: 'https://example.com/avatar.png',
      superApiTokenId: superApiToken.id,
      updatedBy: bot.id
    };

    const space = await createWorkspace({
      spaceData: input,
      userId: user.id,
      extraAdmins: [bot.id]
    });

    const spaceInDb = await prisma.space.findUnique({
      where: {
        id: space.id
      },
      include: {
        spaceRoles: {
          include: {
            user: true
          }
        }
      }
    });

    const botUserSpaceRole = spaceInDb?.spaceRoles.find((r) => r.userId === bot.id);
    const adminUserSpaceRole = spaceInDb?.spaceRoles.find((r) => r.userId === user.id);

    expect(botUserSpaceRole).toBeDefined();
    expect(adminUserSpaceRole).toBeDefined();

    expect(botUserSpaceRole?.isAdmin).toBe(true);
    expect(adminUserSpaceRole?.isAdmin).toBe(true);

    expect(spaceInDb?.updatedBy).toBe(bot.id);
    expect(spaceInDb?.createdBy).toBe(user.id);
  });

  it('should auto-assign the userId as an admin for this space', async () => {
    const space = await createWorkspace({
      spaceData: {
        name: 'Test space'
      },
      userId: user.id
    });

    const spaceRoles = await prisma.spaceRole.findMany({
      where: {
        spaceId: space.id
      }
    });

    expect(spaceRoles).toHaveLength(1);
    const userSpaceRole = spaceRoles[0];
    expect(userSpaceRole).toMatchObject(
      expect.objectContaining<Partial<SpaceRole>>({
        spaceId: space.id,
        userId: user.id,
        isAdmin: true
      })
    );
  });
  it('should create default post categories for the workspace that are accessible to all space members by default', async () => {
    const newWorkspace = await createWorkspace({
      userId: user.id,
      spaceData: {
        name: `Name-${v4()}`,
        domain: `domain-${v4()}`
      }
    });

    const categories = await prisma.postCategory.findMany({
      where: {
        spaceId: newWorkspace.id
      },
      include: {
        postCategoryPermissions: true
      }
    });

    expect(categories).toHaveLength(defaultPostCategories.length);

    expect(categories.every((c) => defaultPostCategories.includes(c.name))).toBe(true);

    categories.forEach((c) => {
      expect(c.postCategoryPermissions).toHaveLength(1);
      expect(c.postCategoryPermissions[0]).toMatchObject(
        expect.objectContaining<Partial<PostCategoryPermission>>({
          spaceId: newWorkspace.id,
          postCategoryId: c.id,
          permissionLevel: 'full_access'
        })
      );
    });
  });

  it('should auto-assign the space domain', async () => {
    const newWorkspace = await createWorkspace({
      userId: user.id,
      spaceData: {
        name: `Name-${v4()}`
      }
    });

    expect(typeof newWorkspace.domain === 'string').toBe(true);
  });

  it('should regenerate the provided space domain if a space with this domain already exists', async () => {
    const spaceName = `name-${v4()}`;
    const domain = `domain-${v4()}`;

    const newSpace = await createWorkspace({
      userId: user.id,
      spaceData: {
        name: spaceName,
        domain
      }
    });

    // Domain shouldn't exist, make sure it wasn't changed
    expect(newSpace.domain).toBe(domain);

    // Handle case where explicit domain is passed
    const secondSpace = await createWorkspace({
      userId: user.id,
      spaceData: {
        name: spaceName,
        domain
      }
    });

    // Make sure we only mutated domain, not name
    expect(secondSpace.name).toBe(newSpace.name);
    expect(secondSpace.domain).not.toBe(newSpace.domain);
  });

  it('should always include the getting started page when creating a space', async () => {
    for (const template of staticSpaceTemplates) {
      const newSpace = await createWorkspace({
        userId: user.id,
        spaceTemplate: template.id,
        spaceData: {
          name: `Name-${v4()}`
        }
      });

      const page = await prisma.page.findFirst({
        where: {
          spaceId: newSpace.id,
          contentText: gettingStartedPage.contentText,
          headerImage: gettingStartedPage.headerImage
        }
      });

      expect(page?.title).toEqual(gettingStartedPage.title);
    }
  });

  it('should set autoGenerated to true for all pages', async () => {
    const spaceName = `name-${v4()}`;
    const newSpace = await createWorkspace({
      userId: user.id,
      spaceData: {
        name: spaceName
      }
    });
    const pages = await prisma.page.findMany({ where: { spaceId: newSpace.id } });
    expect(pages.every((p) => p.autoGenerated)).toBe(true);
  });

  it('should generate a random space domain if no domain is provided with the name, and the name converted to a domain would evaluate to an existing domain', async () => {
    const spaceName = `name-${v4()}`;
    const newSpace = await createWorkspace({
      userId: user.id,
      spaceData: {
        name: spaceName
      }
    });

    // Domain shouldn't exist, make sure it wasn't changed
    expect(newSpace.domain).toBe(spaceName);

    // Handle case where explicit domain is passed
    const secondSpace = await createWorkspace({
      userId: user.id,
      spaceData: {
        name: spaceName
      }
    });

    // Make sure these are two different spaces, with the same name
    expect(secondSpace.name).toBe(newSpace.name);
    expect(secondSpace.domain).not.toBe(newSpace.domain);
    expect(secondSpace.id).not.toBe(newSpace.id);
  });

  it('should generate an initial block count', async () => {
    const space = await createWorkspace({
      spaceData: { name: `name-${v4()}` },
      userId: user.id
    });

    const blockCounts = await prisma.blockCount.count({
      where: {
        spaceId: space.id
      }
    });

    expect(blockCounts).toBe(1);
  });
});
