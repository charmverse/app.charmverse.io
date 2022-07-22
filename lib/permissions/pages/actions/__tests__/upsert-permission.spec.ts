/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { Space, User } from '@prisma/client';
import { prisma } from 'db';
import { InvalidPermissionGranteeError } from 'lib/permissions/errors';
import { InsecureOperationError } from 'lib/utilities/errors';
import { ExpectedAnError } from 'testing/errors';
import { createPage, generateRole, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { v4 } from 'uuid';
import { SelfInheritancePermissionError } from '../../errors';
import { upsertPermission } from '../upsert-permission';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(v4());
  user = generated.user;
  space = generated.space;
});

describe('upsertPermission', () => {

  it('should create a permission for a page', async () => {
    const page = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const createdPermission = await upsertPermission(page.id, {
      permissionLevel: 'full_access',
      userId: user.id
    });

    expect(createdPermission).toBeDefined();
  });

  it('should overwrite an existing permission for a page', async () => {
    const page = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    await upsertPermission(page.id, {
      permissionLevel: 'full_access',
      userId: user.id
    });

    const updatedPermission = await upsertPermission(page.id, {
      permissionLevel: 'view',
      userId: user.id
    });

    const pagePermissionsForUser = await prisma.pagePermission.findMany({
      where: {
        pageId: page.id,
        userId: user.id
      }
    });

    expect(updatedPermission.permissionLevel).toBe('view');
    expect(pagePermissionsForUser.length).toBe(1);
  });

  it('should throw an error if more than one group is linked to the permission', async () => {
    const page = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    // Test groups
    try {

      await upsertPermission(page.id, {
        permissionLevel: 'full_access',
        userId: user.id,
        spaceId: space.id
      });

      throw new ExpectedAnError();
    }
    catch (error) {
      expect(error).toBeInstanceOf(InvalidPermissionGranteeError);
    }

    // Test public
    try {

      await upsertPermission(page.id, {
        permissionLevel: 'full_access',
        userId: user.id,
        public: true
      });

      throw new ExpectedAnError();
    }
    catch (error) {
      expect(error).toBeInstanceOf(InvalidPermissionGranteeError);
    }
  });

  it('should throw an error if an attempt to inherit a permission from itself happens', async () => {
    const parentPage = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const parentPagePermission = await upsertPermission(parentPage.id, {
      pageId: parentPage.id,
      permissionLevel: 'full_access',
      userId: user.id
    });

    try {
      await upsertPermission(parentPage.id, parentPagePermission.id);
      throw new ExpectedAnError();
    }
    catch (error) {
      expect(error).toBeInstanceOf(SelfInheritancePermissionError);
    }
  });

  it('should drop the inheritance reference if trying to inherit a permission from outside the parent tree', async () => {
    const parentPage = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const parentPagePermission = await upsertPermission(parentPage.id, {
      permissionLevel: 'full_access',
      userId: user.id
    });

    const otherParent = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const newPermission = await upsertPermission(otherParent.id, parentPagePermission.id);

    expect(newPermission.inheritedFromPermission).toBeNull();

  });

  it('should specify which permission the permission was inherited from when created', async () => {
    const parent = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const parentPermission = await upsertPermission(parent.id, {
      permissionLevel: 'full_access',
      userId: user.id
    });

    const child = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: parent.id
    });

    const created = await upsertPermission(child.id, parentPermission.id);

    expect(created.sourcePermission?.id).toBe(parentPermission.id);

  });

  it('should delete the reference to the page the permission was inherited from if not provided in upsert mode', async () => {
    const parent = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const parentPermission = await upsertPermission(parent.id, {
      permissionLevel: 'full_access',
      userId: user.id
    });

    const child = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: parent.id
    });

    const created = await upsertPermission(child.id, parentPermission.id);

    const updated = await upsertPermission(child.id, {
      permissionLevel: 'view',
      userId: user.id
    });

    expect(updated.inheritedFromPermission).toBeNull();

  });

  it('should update the permissions that inherit from an existing permission when updated', async () => {
    const parent = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const parentPermission = await upsertPermission(parent.id, {
      permissionLevel: 'full_access',
      userId: user.id
    });

    const child = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: parent.id
    });

    const createdChild = await upsertPermission(child.id, parentPermission.id);

    const updatedParent = await upsertPermission(parent.id, {
      permissionLevel: 'view',
      userId: user.id
    });

    const updatedChild = await prisma.pagePermission.findUnique({
      where: {
        id: createdChild.id
      }
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(updatedChild!.permissionLevel).toBe(updatedParent.permissionLevel);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(updatedChild!.inheritedFromPermission).toBe(updatedParent.id);

  });

  it('should not update the permissions that inherit from an existing permission, where the related page is a sibling', async () => {
    const parent = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const parentPermission = await upsertPermission(parent.id, {
      permissionLevel: 'full_access',
      userId: user.id
    });

    const child = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: parent.id
    });

    const childPermission = await upsertPermission(child.id, parentPermission.id);

    const sibling = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: parent.id
    });

    const siblingPermission = await upsertPermission(sibling.id, parentPermission.id);

    const subChild = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: child.id
    });

    const subChildPermission = await upsertPermission(subChild.id, childPermission.id);

    await upsertPermission(child.id, {
      userId: user.id,
      permissionLevel: 'view'
    });

    const siblingPermissionAfterUpdate = await prisma.pagePermission.findUnique({
      where: {
        id: siblingPermission.id
      }
    });

    const childPermissionAfterUpdate = await prisma.pagePermission.findUnique({
      where: {
        id: childPermission.id
      }
    });

    const subChildPermissionAfterUpdate = await prisma.pagePermission.findUnique({
      where: {
        id: subChildPermission.id
      }
    });

    expect(childPermissionAfterUpdate!.inheritedFromPermission).toBeNull();
    expect(subChildPermissionAfterUpdate!.inheritedFromPermission).toBe(childPermissionAfterUpdate!.id);
    expect(siblingPermissionAfterUpdate!.inheritedFromPermission).toBe(parentPermission.id);

  });

  it('should not create a permission for another space than the space the page belongs to', async () => {

    const page = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const { space: differentSpace } = await generateUserAndSpaceWithApiToken();

    try {
      await upsertPermission(page.id, { permissionLevel: 'full_access', spaceId: differentSpace.id });
      throw new ExpectedAnError();
    }
    catch (err) {
      expect(err).toBeInstanceOf(InsecureOperationError);
    }

  });

  it('should not create a permission for a role that is outside the space the page belongs to', async () => {

    const page = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const { space: differentSpace, user: userFromDifferentSpace } = await generateUserAndSpaceWithApiToken();

    const role = await generateRole({
      createdBy: userFromDifferentSpace.id,
      spaceId: differentSpace.id
    });

    try {
      await upsertPermission(page.id, { permissionLevel: 'full_access', roleId: role.id });
      throw new ExpectedAnError();
    }
    catch (err) {
      expect(err).toBeInstanceOf(InsecureOperationError);
    }
  });

  it('should not create a permission for a user who is not a member of the space the page belongs to', async () => {

    const page = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const { user: userFromDifferentSpace } = await generateUserAndSpaceWithApiToken();

    try {
      await upsertPermission(page.id, { permissionLevel: 'full_access', userId: userFromDifferentSpace.id });
      throw new ExpectedAnError();
    }
    catch (err) {
      expect(err).toBeInstanceOf(InsecureOperationError);
    }
  });

});
