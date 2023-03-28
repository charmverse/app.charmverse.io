import { prisma } from 'db';
import { upsertPermission } from 'lib/permissions/pages';
import {
  createPage,
  generateSpaceUser,
  generateUserAndSpace,
  generateUserAndSpaceWithApiToken
} from 'testing/setupDatabase';
import { generateProposalCategory } from 'testing/utils/proposals';

import { createProposalTemplate } from '../../../templates/proposals/createProposalTemplate';
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

  it('should return only pages marked as deletedAt when admin requests archived pages', async () => {
    const { user, space } = await generateUserAndSpace({
      isAdmin: true
    });

    const page1 = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });
    const page2 = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      deletedAt: new Date()
    });

    const deletablePages = await getAccessiblePages({
      userId: user.id,
      spaceId: space.id,
      archived: true
    });

    expect(deletablePages.length).toBe(1);
    expect(deletablePages[0].id).toBe(page2.id);
  });

  it('should return only pages marked as deletedAt where user can delete the page if user requests archived pages', async () => {
    const { user, space } = await generateUserAndSpace({
      isAdmin: false
    });

    const nonDeletedPageWithPermission = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      pagePermissions: [
        {
          permissionLevel: 'view',
          spaceId: space.id
        }
      ]
    });

    const deletedPageWithoutPermission = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      deletedAt: new Date(),
      pagePermissions: [
        {
          permissionLevel: 'view',
          spaceId: space.id
        }
      ]
    });

    const deletedPageWithPermission = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      deletedAt: new Date(),
      pagePermissions: [
        {
          permissionLevel: 'full_access',
          spaceId: space.id
        }
      ]
    });

    const deletablePages = await getAccessiblePages({
      userId: user.id,
      spaceId: space.id,
      archived: true
    });

    expect(deletablePages.length).toBe(1);
    expect(deletablePages[0].id).toBe(deletedPageWithPermission.id);
  });
});

describe('Page search', () => {
  it('Should return a page based on a simple match', async () => {
    const { user, space } = await generateUserAndSpaceWithApiToken(undefined, true);

    // Page without any permission
    const pageToFind = await createPage({ createdBy: user.id, spaceId: space.id, title: 'Momma' });

    const pages = await getAccessiblePages({ userId: user.id, spaceId: space.id, search: 'mom' });
    expect(pages.map((p) => p.id)).toEqual([pageToFind.id]);
  });

  it('Should return a page when keywords are not adjacent', async () => {
    const { user, space } = await generateUserAndSpaceWithApiToken(undefined, true);

    // Page without any permission
    const pageToFind = await createPage({ createdBy: user.id, spaceId: space.id, title: 'Some simple truths' });

    const pages = await getAccessiblePages({ userId: user.id, spaceId: space.id, search: 'some truths' });
    expect(pages.map((p) => p.id)).toEqual([pageToFind.id]);
  });
});
