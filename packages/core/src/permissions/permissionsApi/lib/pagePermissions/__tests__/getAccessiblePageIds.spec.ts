import type { Page, Proposal, Space, User } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import {
  testUtilsUser,
  testUtilsPages,
  testUtilsProposals,
  testUtilsMembers,
  testUtilsBounties
} from '@charmverse/core/test';
import { InvalidInputError } from '@packages/core/errors';
import { stringUtils } from '@packages/core/utilities';

import { getAccessiblePageIds } from '../getAccessiblePageIds';
import { upsertPagePermission } from '../upsertPagePermission';

describe('getAccessiblePageIds', () => {
  it('Should return all pages if user is admin', async () => {
    const { user: adminUser, space } = await testUtilsUser.generateUserAndSpace({ isAdmin: true });

    // Page without any permission
    await testUtilsPages.generatePage({ createdBy: adminUser.id, spaceId: space.id });
    await testUtilsPages.generatePage({ createdBy: adminUser.id, spaceId: space.id });

    const pages = await getAccessiblePageIds({ userId: adminUser.id, spaceId: space.id });

    expect(pages.length).toBe(2);
  });

  it('Should return all pages (except bounties and proposals) if user has the space-wide delete any page permission', async () => {
    const { user: adminUser, space } = await testUtilsUser.generateUserAndSpace({ isAdmin: true });
    const userWithRole = await testUtilsUser.generateSpaceUser({
      spaceId: space.id
    });
    const role = await testUtilsMembers.generateRole({
      createdBy: adminUser.id,
      spaceId: space.id,
      assigneeUserIds: [userWithRole.id],
      spacePermissions: ['deleteAnyPage']
    });

    const page = await testUtilsPages.generatePage({
      createdBy: adminUser.id,
      spaceId: space.id,
      type: 'page'
    });

    const proposalPage = await testUtilsProposals.generateProposal({
      userId: adminUser.id,
      spaceId: space.id
    });

    const bountyPage = await testUtilsBounties.generateBounty({
      createdBy: adminUser.id,
      spaceId: space.id,
      type: 'bounty',
      approveSubmitters: true,
      status: 'open'
    });

    const pages = await getAccessiblePageIds({ userId: userWithRole.id, spaceId: space.id });

    expect(pages).toEqual([page.id]);
  });

  it('Should return all bounty pages and pages with attached bounties if user has the space-wide delete any bounty permission', async () => {
    const { user: adminUser, space } = await testUtilsUser.generateUserAndSpace({ isAdmin: true });
    const userWithRole = await testUtilsUser.generateSpaceUser({
      spaceId: space.id
    });
    const role = await testUtilsMembers.generateRole({
      createdBy: adminUser.id,
      spaceId: space.id,
      assigneeUserIds: [userWithRole.id],
      spacePermissions: ['deleteAnyBounty']
    });

    const page = await testUtilsPages.generatePage({
      createdBy: adminUser.id,
      spaceId: space.id,
      type: 'page'
    });

    const proposalPage = await testUtilsProposals.generateProposal({
      userId: adminUser.id,
      spaceId: space.id
    });

    const bountyPage = await testUtilsBounties.generateBounty({
      createdBy: adminUser.id,
      spaceId: space.id,
      type: 'bounty',
      approveSubmitters: true,
      status: 'open'
    });

    const cardPageWithAttachedBounty = await testUtilsBounties.generateBounty({
      createdBy: adminUser.id,
      spaceId: space.id,
      type: 'card',
      approveSubmitters: true,
      status: 'open'
    });

    const pages = await getAccessiblePageIds({ userId: userWithRole.id, spaceId: space.id });

    expect(pages).toHaveLength(2);

    expect(pages).toMatchObject(expect.arrayContaining([cardPageWithAttachedBounty.id, bountyPage.id]));
  });

  it('should return only the pages the user has access to', async () => {
    const { space, user: nonAdminUser } = await testUtilsUser.generateUserAndSpace({ isAdmin: false });

    const page1 = await testUtilsPages.generatePage({ createdBy: nonAdminUser.id, spaceId: space.id });
    const page2 = await testUtilsPages.generatePage({ createdBy: nonAdminUser.id, spaceId: space.id });

    await upsertPagePermission({
      pageId: page1.id,
      permission: {
        permissionLevel: 'view',
        assignee: {
          group: 'space',
          id: space.id
        }
      }
    });

    const pages = await getAccessiblePageIds({ userId: nonAdminUser.id, spaceId: space.id });

    expect(pages).toEqual([page1.id]);
  });

  it('Should return only public pages if an anonymous person is requesting', async () => {
    const { space, user: adminUser } = await testUtilsUser.generateUserAndSpace({ isAdmin: true });

    const page1 = await testUtilsPages.generatePage({
      createdBy: adminUser.id,
      spaceId: space.id,
      pagePermissions: [
        {
          permissionLevel: 'view',
          assignee: {
            group: 'public'
          },
          allowDiscovery: true
        }
      ]
    });
    const page2 = await testUtilsPages.generatePage({ createdBy: adminUser.id, spaceId: space.id });

    await upsertPagePermission({
      pageId: page1.id,
      permission: {
        permissionLevel: 'view',
        assignee: {
          group: 'public'
        }
      }
    });

    // Only pass the space id
    const pages = await getAccessiblePageIds({ spaceId: space.id });

    expect(pages).toEqual([page1.id]);
  });

  it('Should not return a page if it has only a space permission, and the user is not a member of that space', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();

    const { user: otherUser } = await testUtilsUser.generateUserAndSpace({ isAdmin: false });

    await testUtilsPages.generatePage({ createdBy: user.id, spaceId: space.id });

    // Only pass the space id
    const pages = await getAccessiblePageIds({ spaceId: space.id, userId: otherUser.id });

    expect(pages.length).toBe(0);
  });

  it('should return only pages marked as deletedAt when admin requests archived pages', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace({
      isAdmin: true
    });

    const page1 = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id
    });
    const page2 = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      deletedAt: new Date()
    });

    const deletablePages = await getAccessiblePageIds({
      userId: user.id,
      spaceId: space.id,
      archived: true
    });

    expect(deletablePages).toEqual([page2.id]);
  });

  it('should parse the limit if it was passed as a string', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace({ isAdmin: true });
    const pages = await Promise.all([
      testUtilsPages.generatePage({ createdBy: user.id, spaceId: space.id }),
      testUtilsPages.generatePage({ createdBy: user.id, spaceId: space.id }),
      testUtilsPages.generatePage({ createdBy: user.id, spaceId: space.id })
    ]);

    const foundPages1 = await getAccessiblePageIds({
      spaceId: space.id,
      userId: user.id,
      limit: '2' as any
    });

    expect(foundPages1).toHaveLength(2);

    const foundPages2 = await getAccessiblePageIds({
      spaceId: space.id,
      userId: user.id,
      // Empty string should be treated as undefined
      limit: '' as any
    });

    expect(foundPages2).toHaveLength(pages.length);

    const foundPages3 = await getAccessiblePageIds({
      spaceId: space.id,
      userId: user.id,
      // Invalid string evals to NaN and should be treated as undefined
      limit: 'invalid' as any
    });

    expect(foundPages3).toHaveLength(pages.length);
  });

  it('should return only pages marked as deletedAt where user can delete the page if user requests archived pages', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace({
      isAdmin: false
    });

    const nonDeletedPageWithPermission = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      pagePermissions: [
        {
          permissionLevel: 'view',
          assignee: {
            group: 'space',
            id: space.id
          }
        }
      ]
    });

    const deletedPageWithoutPermission = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      deletedAt: new Date(),
      pagePermissions: [
        {
          permissionLevel: 'view',
          assignee: {
            group: 'space',
            id: space.id
          }
        }
      ]
    });

    const deletedPageWithPermission = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      deletedAt: new Date(),
      pagePermissions: [
        {
          permissionLevel: 'full_access',
          assignee: {
            group: 'space',
            id: space.id
          }
        }
      ]
    });

    const deletablePages = await getAccessiblePageIds({
      userId: user.id,
      spaceId: space.id,
      archived: true
    });

    expect(deletablePages).toEqual([deletedPageWithPermission.id]);
  });

  it('should only return public pages to a space member, guest user, or person outside the space if allowDiscovery is true', async () => {
    const { user: adminUser, space } = await testUtilsUser.generateUserAndSpace({ isAdmin: true });

    const spaceMember = await testUtilsUser.generateSpaceUser({
      isGuest: false,
      spaceId: space.id
    });
    const spaceGuest = await testUtilsUser.generateSpaceUser({
      isGuest: true,
      spaceId: space.id
    });

    const publicPage = await testUtilsPages.generatePage({
      createdBy: adminUser.id,
      spaceId: space.id,
      pagePermissions: [{ assignee: { group: 'public' }, permissionLevel: 'view' }]
    });

    const publicPageWithAllowDiscovery = await testUtilsPages.generatePage({
      createdBy: adminUser.id,
      spaceId: space.id,
      pagePermissions: [{ assignee: { group: 'public' }, permissionLevel: 'view', allowDiscovery: true }]
    });

    const pagesForMember = await getAccessiblePageIds({
      spaceId: space.id,
      userId: spaceMember.id
    });

    expect(pagesForMember).toEqual([publicPageWithAllowDiscovery.id]);

    const pagesForGuest = await getAccessiblePageIds({
      spaceId: space.id,
      userId: spaceGuest.id
    });

    expect(pagesForGuest).toEqual([publicPageWithAllowDiscovery.id]);

    const pagesForAnon = await getAccessiblePageIds({
      spaceId: space.id,
      userId: undefined
    });

    expect(pagesForAnon).toEqual([publicPageWithAllowDiscovery.id]);
  });

  it('should throw an error if no space ID is provided', async () => {
    await expect(getAccessiblePageIds({ spaceId: undefined as any })).rejects.toBeInstanceOf(InvalidInputError);
  });
});

describe('Page search', () => {
  it('Should return a page based on a simple match', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace({ isAdmin: true });

    // Page without any permission
    const pageToFind = await testUtilsPages.generatePage({ createdBy: user.id, spaceId: space.id, title: 'Momma' });

    const pages = await getAccessiblePageIds({ userId: user.id, spaceId: space.id, search: 'mom' });
    expect(pages).toEqual([pageToFind.id]);
  });

  it('Should return a page based on a match on nested content', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace({ isAdmin: true });

    // Page without any permission
    const pageToFind = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      title: 'Searched page',
      contentText: 'Specific content'
    });

    const pages = await getAccessiblePageIds({ userId: user.id, spaceId: space.id, search: 'Specific' });
    expect(pages).toEqual([pageToFind.id]);
  });

  it('Should return a page when keywords are not adjacent', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace({ isAdmin: true });

    // Page without any permission
    const pageToFind = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      title: 'Some simple truths'
    });

    const pages = await getAccessiblePageIds({ userId: user.id, spaceId: space.id, search: 'some truths' });
    expect(pages).toEqual([pageToFind.id]);
  });

  it('should handle special tsquery characters', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace({ isAdmin: true });

    const tsQuerySpecialCharsList = stringUtils.tsQueryLanguageCharacters();

    const pageToFind = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      title: `Special ${tsQuerySpecialCharsList.join('')} page`
    });

    const pageWithoutMatch = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      title: 'No match'
    });

    for (const char of tsQuerySpecialCharsList) {
      // eslint-disable-next-line prettier/prettier, no-useless-escape
      const pages = await getAccessiblePageIds({ userId: user.id, spaceId: space.id, search: `special ${char} page` });
      expect(pages).toEqual([pageToFind.id]);
    }
  });

  it('should return only the pages a guest user has individual access to, not taking into account space-wide permissions', async () => {
    const { space, user: nonAdminUser } = await testUtilsUser.generateUserAndSpace();
    const guestUser = await testUtilsUser.generateSpaceUser({
      spaceId: space.id,
      isGuest: true
    });

    const page1 = await testUtilsPages.generatePage({
      createdBy: nonAdminUser.id,
      spaceId: space.id,
      pagePermissions: [
        {
          permissionLevel: 'view',
          assignee: { group: 'space', id: space.id }
        }
      ]
    });
    const page2 = await testUtilsPages.generatePage({
      createdBy: nonAdminUser.id,
      spaceId: space.id,
      pagePermissions: [
        {
          permissionLevel: 'view',
          assignee: { group: 'space', id: space.id }
        },
        {
          permissionLevel: 'view',
          assignee: {
            group: 'user',
            id: guestUser.id
          }
        }
      ]
    });

    const pages = await getAccessiblePageIds({ userId: guestUser.id, spaceId: space.id });

    expect(pages).toEqual([page2.id]);
  });

  it('should only return the list of public pages a guest has an explicit user permission for', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace({ isAdmin: true });

    const guestUser = await testUtilsUser.generateSpaceUser({
      spaceId: space.id,
      isGuest: true
    });

    const pageWithExplicitGuestPermission = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      pagePermissions: [
        {
          assignee: { group: 'user', id: guestUser.id },
          permissionLevel: 'view_comment'
        },
        {
          assignee: { group: 'public' },
          permissionLevel: 'view',
          allowDiscovery: true
        }
      ]
    });

    const pageWithOnlyPublicPermission = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      pagePermissions: [
        {
          assignee: { group: 'public' },
          permissionLevel: 'view'
        }
      ]
    });
    const pages = await getAccessiblePageIds({ userId: guestUser.id, spaceId: space.id });

    expect(pages).toEqual([pageWithExplicitGuestPermission.id]);
  });
});

describe('Page filter', () => {
  it('Should return only a reward', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace({ isAdmin: true });

    // Page without any permission
    await testUtilsPages.generatePage({ createdBy: user.id, spaceId: space.id, title: 'Momma' });
    const pageToFind = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      title: 'Momma',
      type: 'bounty'
    });

    const pages = await getAccessiblePageIds({ userId: user.id, spaceId: space.id, filter: 'reward' });
    expect(pages).toEqual([pageToFind.id]);
  });

  it('Should return only non-cards', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace({ isAdmin: true });

    // Page without any permission
    await testUtilsPages.generatePage({ createdBy: user.id, spaceId: space.id, title: 'Momma', type: 'card' });
    const pageToFind = await testUtilsPages.generatePage({ createdBy: user.id, spaceId: space.id, title: 'Momma' });

    const pages = await getAccessiblePageIds({ userId: user.id, spaceId: space.id, filter: 'not_card' });
    expect(pages).toEqual([pageToFind.id]);
  });

  it('Should filter out proposals for sidebar_view', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace({ isAdmin: true });

    await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id
    });
    const pageToFind = await testUtilsPages.generatePage({ createdBy: user.id, spaceId: space.id, title: 'Momma' });

    const pages = await getAccessiblePageIds({ userId: user.id, spaceId: space.id, filter: 'sidebar_view' });
    expect(pages.sort()).toEqual([pageToFind.id].sort());
  });
});

describe('getAccessiblePageIds - bounties', () => {
  it('should always return a bounty with with a public permission, even if allowDiscovery is false', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace({
      isAdmin: true
    });

    const spaceMember = await testUtilsUser.generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    });

    const bounty = await testUtilsBounties.generateBounty({
      approveSubmitters: true,
      createdBy: user.id,
      spaceId: space.id,
      status: 'open',
      bountyPermissions: {
        submitter: [{ group: 'space', id: space.id }]
      }
    });
    await prisma.pagePermission.create({
      data: {
        page: { connect: { id: bounty.id } },
        permissionLevel: 'view',
        public: true
      }
    });

    const anonPages = await getAccessiblePageIds({
      spaceId: space.id,
      // A user outside of the space
      userId: undefined
    });

    expect(anonPages.length).toBe(1);
    expect(anonPages).toEqual([bounty.id]);

    const memberPages = await getAccessiblePageIds({
      spaceId: space.id,
      // A user outside of the space
      userId: spaceMember.id
    });

    expect(memberPages.length).toBe(1);
    expect(memberPages).toEqual([bounty.id]);
  });
});
describe('getAccessiblePageIds - cards', () => {
  it('should always return a card with with a public permission, even if allowDiscovery is false', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace({
      isAdmin: true
    });

    const spaceMember = await testUtilsUser.generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    });

    const card = await testUtilsPages.generatePage({
      type: 'card',
      createdBy: user.id,
      spaceId: space.id
    });
    await prisma.pagePermission.create({
      data: {
        page: { connect: { id: card.id } },
        permissionLevel: 'view',
        public: true
      }
    });

    const anonPages = await getAccessiblePageIds({
      spaceId: space.id,
      // A user outside of the space
      userId: undefined
    });

    expect(anonPages).toEqual([card.id]);

    const memberPages = await getAccessiblePageIds({
      spaceId: space.id,
      // A user outside of the space
      userId: spaceMember.id
    });

    expect(memberPages).toEqual([card.id]);
  });
});
