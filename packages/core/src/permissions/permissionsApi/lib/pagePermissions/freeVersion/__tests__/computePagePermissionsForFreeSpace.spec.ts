import type { Page, Space, User } from '@charmverse/core/prisma';
import { PageOperations } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsPages, testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import type { PagePermissionFlags } from '@packages/core/permissions';
import { objectUtils } from '@packages/core/utilities';

import {
  baseComputePagePermissionsForFreeSpace,
  computePagePermissionsForFreeSpace
} from '../computePagePermissionsForFreeSpace';

let user: User;
let adminUser: User;
let authorUser: User;
let space: Space;
let page: Page;

beforeAll(async () => {
  const generated = await testUtilsUser.generateUserAndSpace({ isAdmin: true });
  space = generated.space;
  adminUser = generated.user;
  user = await testUtilsUser.generateSpaceUser({ isAdmin: false, spaceId: space.id });
  authorUser = await testUtilsUser.generateSpaceUser({ isAdmin: false, spaceId: space.id });
  page = await testUtilsPages.generatePage({
    createdBy: authorUser.id,
    spaceId: space.id
  });
});

const basePermissions: PageOperations[] = [
  'comment',
  'create_poll',
  'delete',
  'edit_content',
  'edit_path',
  'edit_position',
  'read',
  'edit_lock'
];

describe('baseComputePagePermissionsForFreeSpace', () => {
  it('should allow the author, admin or space member to edit the document with the same level of permissions', async () => {
    const userComputed = await baseComputePagePermissionsForFreeSpace({
      resourceId: page.id,
      userId: user.id
    });

    const adminComputed = await baseComputePagePermissionsForFreeSpace({
      resourceId: page.id,
      userId: adminUser.id
    });

    const authorComputed = await baseComputePagePermissionsForFreeSpace({
      resourceId: page.id,
      userId: authorUser.id
    });

    const operations = objectUtils.typedKeys(PageOperations);

    [userComputed, adminComputed, authorComputed].forEach((permissionSet) => {
      operations.forEach((op) => {
        if (basePermissions.includes(op)) {
          expect(permissionSet[op]).toBe(true);
        } else {
          expect(permissionSet[op]).toBe(false);
        }
      });
    });
  });
  // This test exists so we can apply a certain permission level to the space, but make it higher or lower for a user
  it('should provide only the read permission to people outside the space', async () => {
    const { user: outsideUser } = await testUtilsUser.generateUserAndSpace({
      isAdmin: true
    });

    const outsideUserComputed = await baseComputePagePermissionsForFreeSpace({
      resourceId: page.id,
      userId: outsideUser.id
    });

    expect(outsideUserComputed).toMatchObject<PagePermissionFlags>({
      comment: false,
      create_poll: false,
      delete: false,
      edit_content: false,
      edit_lock: false,
      edit_path: false,
      edit_position: false,
      grant_permissions: false,
      delete_attached_bounty: false,
      read: true
    });

    const publicUserComputed = await baseComputePagePermissionsForFreeSpace({
      resourceId: page.id,
      userId: undefined
    });

    expect(publicUserComputed).toMatchObject<PagePermissionFlags>({
      comment: false,
      create_poll: false,
      delete: false,
      edit_content: false,
      edit_lock: false,
      edit_path: false,
      edit_position: false,
      grant_permissions: false,
      delete_attached_bounty: false,
      read: true
    });
  });
});

describe('computePagePermissionsForFreeSpace - with proposal policy', () => {
  it('should return unmodified permissions for admins if page has been converted to a proposal', async () => {
    const { user: localAdminUser, space: localSpace } = await testUtilsUser.generateUserAndSpace({ isAdmin: true });

    const spaceMember = await testUtilsUser.generateSpaceUser({
      spaceId: localSpace.id,
      isAdmin: false
    });

    const categoryName = 'Example category';
    const testPage = await testUtilsPages.generatePage({
      createdBy: spaceMember.id,
      spaceId: localSpace.id
    });

    const permissions = await computePagePermissionsForFreeSpace({
      resourceId: testPage.id,
      userId: localAdminUser.id
    });

    const proposal = await testUtilsProposals.generateProposal({ spaceId: localSpace.id, userId: localAdminUser.id });
    await prisma.page.update({
      where: {
        id: testPage.id
      },
      data: {
        convertedProposalId: proposal.id
      }
    });

    const permissionsAfterConverting = await computePagePermissionsForFreeSpace({
      resourceId: testPage.id,
      userId: localAdminUser.id
    });

    expect(permissionsAfterConverting).toMatchObject(permissions);
  });

  it('should return only read permissions for space members if page has been converted to a proposal', async () => {
    const { user: nonAdminUser, space: localSpace } = await testUtilsUser.generateUserAndSpace({ isAdmin: false });
    const testPage = await testUtilsPages.generatePage({
      createdBy: nonAdminUser.id,
      spaceId: localSpace.id
    });
    const proposal = await testUtilsProposals.generateProposal({ spaceId: localSpace.id, userId: nonAdminUser.id });
    await prisma.page.update({
      where: {
        id: testPage.id
      },
      data: {
        convertedProposalId: proposal.id
      }
    });

    const permissions = await computePagePermissionsForFreeSpace({
      resourceId: testPage.id,
      userId: nonAdminUser.id
    });

    expect(permissions).toMatchObject<PagePermissionFlags>({
      comment: false,
      create_poll: false,
      delete: false,
      edit_content: false,
      edit_lock: false,
      edit_path: false,
      edit_position: false,
      grant_permissions: false,
      delete_attached_bounty: false,
      read: true
    });
  });
});

describe('computePagePermissionsForFreeSpace - with bounty policy', () => {
  it('should only allow the admin and bounty creator to edit a page that is a bounty', async () => {
    const { user: bountyCreator, space: localSpace } = await testUtilsUser.generateUserAndSpace({ isAdmin: false });
    const localSpaceMember = await testUtilsUser.generateSpaceUser({ spaceId: localSpace.id, isAdmin: false });
    const localSpaceAdmin = await testUtilsUser.generateSpaceUser({ spaceId: localSpace.id, isAdmin: true });

    const bounty = await prisma.bounty.create({
      data: {
        status: 'open',
        author: { connect: { id: bountyCreator.id } },
        space: { connect: { id: localSpace.id } }
      }
    });

    const bountyPage = await testUtilsPages.generatePage({
      createdBy: bountyCreator.id,
      spaceId: localSpace.id,
      bountyId: bounty.id,
      type: 'bounty'
    });
    const creatorPermissions = await computePagePermissionsForFreeSpace({
      resourceId: bountyPage.id,
      userId: bountyCreator.id
    });

    expect(creatorPermissions.edit_content).toBe(true);
    expect(creatorPermissions.delete).toBe(true);
    expect(creatorPermissions.read).toBe(true);

    const adminPermissions = await computePagePermissionsForFreeSpace({
      resourceId: bountyPage.id,
      userId: localSpaceAdmin.id
    });

    expect(adminPermissions.edit_content).toBe(true);
    expect(adminPermissions.delete).toBe(true);
    expect(adminPermissions.read).toBe(true);
    const memberPermissions = await computePagePermissionsForFreeSpace({
      resourceId: bountyPage.id,
      userId: localSpaceMember.id
    });

    expect(memberPermissions.edit_content).toBe(false);
    expect(memberPermissions.delete).toBe(false);
    expect(creatorPermissions.read).toBe(true);
  });
});
