import type { SpaceRole, User } from '@prisma/client';
import { v4 } from 'uuid';

import { prisma } from 'db';
import { defaultPostCategories } from 'lib/forums/categories/generateDefaultPostCategories';

import { createWorkspace } from '../createWorkspace';

let user: User;

beforeAll(async () => {
  user = await prisma.user.create({ data: { username: 'demo-user' } });
});

describe('createWorkspace', () => {
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
  it('should create default post categories for the workspace', async () => {
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
      }
    });

    expect(categories).toHaveLength(defaultPostCategories.length);

    expect(categories.every((c) => defaultPostCategories.includes(c.name))).toBe(true);
  });

  it('should auto-assign the space domain', async () => {
    const newWorkspace = await createWorkspace({
      userId: user.id,
      spaceData: {
        name: `Name-${v4()}`
      }
    });
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
});
