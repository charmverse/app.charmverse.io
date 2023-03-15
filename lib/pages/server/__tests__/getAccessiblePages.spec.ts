import { prisma } from 'db';
import type { IPagePermissionWithSource } from 'lib/permissions/pages';
import { setupPermissionsAfterPagePermissionAdded, upsertPermission } from 'lib/permissions/pages';
import {
  createPage,
  generateSpaceUser,
  generateUserAndSpace,
  generateUserAndSpaceWithApiToken
} from 'testing/setupDatabase';
import { generateProposalCategory } from 'testing/utils/proposals';

import { createProposalTemplate } from '../../../templates/proposals/createProposalTemplate';
import type { IPageWithPermissions } from '../../interfaces';
import { getAccessiblePages } from '../getAccessiblePages';

describe('getAccessiblePages', () => {
  it('Should return all pages if user is admin', async () => {
    const { user: adminUser, space } = await generateUserAndSpaceWithApiToken(undefined, true);

    // Page without any permission
    await createPage({ createdBy: adminUser.id, spaceId: space.id });
    await createPage({ createdBy: adminUser.id, spaceId: space.id });

    const pages = await getAccessiblePages({ userId: adminUser.id, spaceId: space.id });

    expect(pages.length).toBe(2);
  });

  it('should return only the pages the user has access to', async () => {
    const { space, user: nonAdminUser } = await generateUserAndSpaceWithApiToken(undefined, false);

    const page1 = await createPage({ createdBy: nonAdminUser.id, spaceId: space.id });
    const page2 = await createPage({ createdBy: nonAdminUser.id, spaceId: space.id });

    await upsertPermission(page1.id, {
      permissionLevel: 'view',
      spaceId: space.id
    });

    const pages = await getAccessiblePages({ userId: nonAdminUser.id, spaceId: space.id });

    expect(pages.length).toBe(1);
    expect(pages[0].id).toBe(page1.id);
  });

  it('should return only the pages a guest user has individual access to as well as public pages', async () => {
    const { space, user: nonAdminUser } = await generateUserAndSpace();
    const guestUser = await generateSpaceUser({
      spaceId: space.id,
      isGuest: true
    });

    const page1 = await createPage({ createdBy: nonAdminUser.id, spaceId: space.id });
    const page2 = await createPage({ createdBy: nonAdminUser.id, spaceId: space.id });

    await upsertPermission(page1.id, {
      permissionLevel: 'view',
      spaceId: space.id
    });

    await upsertPermission(page2.id, {
      permissionLevel: 'view',
      userId: guestUser.id
    });

    const pages = await getAccessiblePages({ userId: guestUser.id, spaceId: space.id });

    expect(pages.length).toBe(1);
    expect(pages[0].id).toBe(page2.id);
  });

  it('should return proposal templates independent of their permissions the pages the user has access to in the target space', async () => {
    const { space, user: nonAdminUser } = await generateUserAndSpaceWithApiToken(undefined, false);

    const { space: secondSpace, user: secondUser } = await generateUserAndSpaceWithApiToken(undefined, false);

    const page1 = await createPage({ createdBy: nonAdminUser.id, spaceId: space.id });
    await upsertPermission(page1.id, {
      permissionLevel: 'view',
      spaceId: space.id
    });

    // No permissions here
    const proposalPage = await createPage({ createdBy: nonAdminUser.id, spaceId: space.id });
    await prisma.page.update({ where: { id: proposalPage.id }, data: { type: 'proposal_template' } });

    const proposalTemplateCategory = await generateProposalCategory({
      spaceId: space.id
    });

    // SHouldn't show up
    await createProposalTemplate({
      spaceId: secondSpace.id,
      userId: secondUser.id,
      categoryId: proposalTemplateCategory.id,
      pageContent: {
        title: 'Test',
        content: {},
        contentText: 'Test'
      }
    });

    const pages = await getAccessiblePages({ userId: nonAdminUser.id, spaceId: space.id });

    expect(pages.length).toBe(2);
    expect(pages.some((p) => p.id === page1.id)).toBe(true);
    expect(pages.some((p) => p.id === proposalPage.id)).toBe(true);
  });

  it('Should return only public pages if an anonymous person is requesting', async () => {
    const { space, user: adminUser } = await generateUserAndSpaceWithApiToken(undefined, true);

    const page1 = await createPage({ createdBy: adminUser.id, spaceId: space.id });
    const page2 = await createPage({ createdBy: adminUser.id, spaceId: space.id });

    await upsertPermission(page1.id, {
      permissionLevel: 'view',
      public: true
    });

    // Only pass the space id
    const pages = await getAccessiblePages({ spaceId: space.id });

    expect(pages.length).toBe(1);
    expect(pages[0].id).toBe(page1.id);
  });

  it('Should not return a page if it has only a space permission, and the user is not a member of that space', async () => {
    const { space, user } = await generateUserAndSpaceWithApiToken();

    const { user: otherUser } = await generateUserAndSpaceWithApiToken(undefined, false);

    const page1 = await createPage({ createdBy: user.id, spaceId: space.id });

    await upsertPermission(page1.id, {
      permissionLevel: 'view',
      spaceId: space.id
    });

    // Only pass the space id
    const pages = await getAccessiblePages({ spaceId: space.id, userId: otherUser.id });

    expect(pages.length).toBe(0);
  });

  it('Should include permissions for each page, and the source for each permision', async () => {
    const { space, user } = await generateUserAndSpaceWithApiToken();

    const page = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const childPage = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: page.id
    });

    const upsertedPermission = await upsertPermission(page.id, {
      spaceId: space.id,
      permissionLevel: 'full_access'
    });

    await setupPermissionsAfterPagePermissionAdded(upsertedPermission.id);

    const pages = await getAccessiblePages({ spaceId: space.id, userId: user.id });

    const foundChild = pages.find((p) => p.id === childPage.id) as IPageWithPermissions;
    const foundInherited = foundChild.permissions.find(
      (perm) => perm.spaceId === space.id
    ) as IPagePermissionWithSource;

    // We are returning permissions
    expect(foundInherited).toBeDefined();

    // We are returning source
    expect(foundInherited.sourcePermission).toBeDefined();
  });

  it('Should return a page based on search', async () => {
    const { user: adminUser, space } = await generateUserAndSpaceWithApiToken(undefined, true);

    // Page without any permission
    const pageToFind = await createPage({ createdBy: adminUser.id, spaceId: space.id, title: 'Momma' });
    await createPage({ createdBy: adminUser.id, spaceId: space.id, title: 'Papa' });

    const pages = await getAccessiblePages({ userId: adminUser.id, spaceId: space.id, search: 'mom' });
    expect(pages.map((p) => p.id)).toEqual([pageToFind.id]);
  });
});
