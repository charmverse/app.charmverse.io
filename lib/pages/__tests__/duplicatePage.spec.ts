import { prisma } from '@charmverse/core';
import type { Prisma } from '@charmverse/core/prisma';
import { v4 as uid } from 'uuid';

import { createPage, generateUserAndSpace } from 'testing/setupDatabase';

import { duplicatePage } from '../duplicatePage';

describe('duplicatePage', () => {
  it('should include permissions from the original page', async () => {
    const { space } = await generateUserAndSpace();
    const pagePermissions = [
      {
        userId: null,
        id: uid(),
        permissionLevel: 'full_access' as const,
        spaceId: space.id
      },
      {
        id: uid(),
        permissionLevel: 'editor' as const,
        userId: space.createdBy
      },
      {
        id: uid(),
        permissionLevel: 'view' as const,
        public: true
      }
    ];
    const pageToDuplicate = await createPage({
      spaceId: space.id,
      createdBy: space.createdBy,
      pagePermissions
    });

    const duplicatedPage = await duplicatePage({ pageId: pageToDuplicate.id, parentId: null, spaceId: space.id });

    const result = await prisma.page.findUniqueOrThrow({
      where: { id: duplicatedPage.rootPageId },
      include: { permissions: true }
    });

    expect(result.permissions.length).toBe(3);

    expect(result.permissions).toEqual(
      expect.arrayContaining(
        pagePermissions.map((perm) =>
          expect.objectContaining({
            ...perm,
            id: expect.any(String)
          })
        )
      )
    );
  });
  it('should duplicate the inheritance tree for all child pages of the original page', async () => {
    const { space } = await generateUserAndSpace();
    const rootPagePermissions: Prisma.PagePermissionCreateManyPageInput[] = [
      {
        userId: null,
        id: uid(),
        permissionLevel: 'full_access',
        spaceId: space.id
      },
      {
        id: uid(),
        permissionLevel: 'editor',
        userId: space.createdBy
      }
    ];

    const childPagePermissions: Prisma.PagePermissionCreateManyPageInput[] = [
      ...rootPagePermissions.map((perm) => ({
        ...perm,
        inheritedFromPermission: perm.id,
        id: uid()
      })),
      // Add an extra permission which should inherit downwards
      {
        id: uid(),
        permissionLevel: 'view' as const,
        public: true
      }
    ];

    const nestedPagePermissions = childPagePermissions.map((perm) => ({
      ...perm,
      // Cascade existing inheritance relationship, or make this permission the source of inheritance
      inheritedFromPermission: perm.inheritedFromPermission ?? perm.id,
      id: uid()
    }));

    const rootPage = await createPage({
      spaceId: space.id,
      createdBy: space.createdBy,
      pagePermissions: rootPagePermissions,
      title: 'Root'
    });

    const childPage = await createPage({
      spaceId: space.id,
      createdBy: space.createdBy,
      pagePermissions: childPagePermissions,
      parentId: rootPage.id,
      title: 'Child'
    });
    const nestedPage = await createPage({
      spaceId: space.id,
      createdBy: space.createdBy,
      pagePermissions: nestedPagePermissions,
      parentId: childPage.id,
      title: 'Nested'
    });

    const duplicatedPage = await duplicatePage({ pageId: rootPage.id, parentId: null, spaceId: space.id });

    const duplicateRoot = await prisma.page.findUniqueOrThrow({
      where: { id: duplicatedPage.rootPageId },
      include: { permissions: true }
    });

    expect(duplicateRoot.permissions.length).toBe(rootPagePermissions.length);
    expect(duplicateRoot.permissions).toEqual(
      expect.arrayContaining(
        rootPagePermissions.map((perm) =>
          expect.objectContaining({
            ...perm,
            inheritedFromPermission: null,
            id: expect.any(String)
          })
        )
      )
    );

    // ---- Check the child
    const duplicateChild = await prisma.page.findFirstOrThrow({
      where: { parentId: duplicatedPage.rootPageId },
      include: { permissions: true }
    });

    expect(duplicateChild.permissions.length).toBe(childPagePermissions.length);
    // Check inheritance worked correctly (except for the locally defined child permission)
    duplicateChild.permissions.forEach((duplicatedPermission) => {
      if (duplicatedPermission.inheritedFromPermission) {
        expect(
          duplicateRoot.permissions.some(
            (p) =>
              p.id === duplicatedPermission.inheritedFromPermission &&
              p.permissionLevel === duplicatedPermission.permissionLevel
          )
        ).toBe(true);
      }
    });

    // ---- Check the nested child
    const duplicateNestedChild = await prisma.page.findFirstOrThrow({
      where: { parentId: duplicateChild.id },
      include: { permissions: true }
    });
    expect(duplicateNestedChild.permissions.length).toBe(nestedPagePermissions.length);
    // Check inheritance worked correctly from the root since in this case, inheritance is being passed down from top
    duplicateNestedChild.permissions.forEach((duplicatedPermission) => {
      // This test sets up the public permission as inherited by nested from the intermediate child
      if (duplicatedPermission.public) {
        expect(
          duplicateChild.permissions.some(
            (p) =>
              p.public &&
              p.id === duplicatedPermission.inheritedFromPermission &&
              p.permissionLevel === duplicatedPermission.permissionLevel
          )
        ).toBe(true);
      } else {
        expect(
          duplicateRoot.permissions.some(
            (p) =>
              p.id === duplicatedPermission.inheritedFromPermission &&
              p.permissionLevel === duplicatedPermission.permissionLevel
          )
        ).toBe(true);
      }
    });
  });
});
