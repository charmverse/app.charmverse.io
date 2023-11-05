import type { PagePermissionFlags } from '@charmverse/core/permissions';
import type { Page, Space, User } from '@charmverse/core/prisma';
import { PageOperations } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsPages, testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import { objectUtils } from '@charmverse/core/utilities';

import { convertPageToProposal } from 'lib/proposal/convertPageToProposal';

import { computePagePermissions } from '../computePagePermissions';

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
  'read'
];

describe('baseComputePagePermissions', () => {
  it('should allow the author, admin or space member to edit the document with the same level of permissions', async () => {
    const userComputed = await computePagePermissions({
      resourceId: page.id,
      userId: user.id
    });

    const adminComputed = await computePagePermissions({
      resourceId: page.id,
      userId: adminUser.id
    });

    const authorComputed = await computePagePermissions({
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

    const outsideUserComputed = await computePagePermissions({
      resourceId: page.id,
      userId: outsideUser.id
    });

    expect(outsideUserComputed).toMatchObject<PagePermissionFlags>({
      comment: false,
      create_poll: false,
      delete: false,
      edit_content: false,
      edit_isPublic: false,
      edit_path: false,
      edit_position: false,
      grant_permissions: false,
      delete_attached_bounty: false,
      read: true
    });

    const publicUserComputed = await computePagePermissions({
      resourceId: page.id,
      userId: undefined
    });

    expect(publicUserComputed).toMatchObject<PagePermissionFlags>({
      comment: false,
      create_poll: false,
      delete: false,
      edit_content: false,
      edit_isPublic: false,
      edit_path: false,
      edit_position: false,
      grant_permissions: false,
      delete_attached_bounty: false,
      read: true
    });
  });
});

describe('computePagePermissions - with proposal policy', () => {
  it('should return unmodified permissions for admins if page has been converted to a proposal', async () => {
    const { user: localAdminUser, space: localSpace } = await testUtilsUser.generateUserAndSpace({ isAdmin: true });
    const spaceMember = await testUtilsUser.generateSpaceUser({
      spaceId: localSpace.id,
      isAdmin: false
    });

    const categoryName = 'Example category';

    const category = await testUtilsProposals.generateProposalCategory({
      spaceId: localSpace.id,
      title: categoryName
    });

    const testPage = await testUtilsPages.generatePage({
      createdBy: spaceMember.id,
      spaceId: localSpace.id
    });

    const permissions = await computePagePermissions({
      resourceId: testPage.id,
      userId: localAdminUser.id
    });

    await convertPageToProposal({
      page: testPage,
      categoryId: category.id,
      userId: spaceMember.id
    });

    const permissionsAfterConverting = await computePagePermissions({
      resourceId: testPage.id,
      userId: localAdminUser.id
    });

    expect(permissionsAfterConverting).toMatchObject(permissions);
  });
  it('should return only read permissions for space members if page has been converted to a proposal', async () => {
    const { user: nonAdminUser, space: localSpace } = await testUtilsUser.generateUserAndSpace({ isAdmin: false });

    const categoryName = 'Example category';

    const category = await testUtilsProposals.generateProposalCategory({
      spaceId: localSpace.id,
      title: categoryName
    });

    const testPage = await testUtilsPages.generatePage({
      createdBy: nonAdminUser.id,
      spaceId: localSpace.id
    });
    await convertPageToProposal({
      page: testPage,
      categoryId: category.id,
      userId: nonAdminUser.id
    });

    const permissions = await computePagePermissions({
      resourceId: testPage.id,
      userId: nonAdminUser.id
    });

    expect(permissions).toMatchObject<PagePermissionFlags>({
      comment: false,
      create_poll: false,
      delete: false,
      edit_content: false,
      edit_isPublic: false,
      edit_path: false,
      edit_position: false,
      grant_permissions: false,
      delete_attached_bounty: false,
      read: true
    });
  });
});

describe('computePagePermissions - with bounty policy', () => {
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
    const creatorPermissions = await computePagePermissions({
      resourceId: bountyPage.id,
      userId: bountyCreator.id
    });

    expect(creatorPermissions.edit_content).toBe(true);
    expect(creatorPermissions.delete).toBe(true);
    expect(creatorPermissions.read).toBe(true);

    const adminPermissions = await computePagePermissions({
      resourceId: bountyPage.id,
      userId: localSpaceAdmin.id
    });

    expect(adminPermissions.edit_content).toBe(true);
    expect(adminPermissions.delete).toBe(true);
    expect(adminPermissions.read).toBe(true);
    const memberPermissions = await computePagePermissions({
      resourceId: bountyPage.id,
      userId: localSpaceMember.id
    });

    expect(memberPermissions.edit_content).toBe(false);
    expect(memberPermissions.delete).toBe(false);
    expect(creatorPermissions.read).toBe(true);
  });
});
