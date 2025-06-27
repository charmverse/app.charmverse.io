import type { Page, Role, Space, User } from '@charmverse/core/prisma-client';
import { testUtilsMembers, testUtilsPages, testUtilsProposals, testUtilsUser } from '@charmverse/core/test';

import { bulkComputePagePermissionsForFreeSpace } from '../bulkComputePagePermissionsForFreeSpace';
import { computePagePermissionsForFreeSpace } from '../computePagePermissionsForFreeSpace';

describe('bulkComputePagePermissionsForFreeSpace', () => {
  let firstSpace: Space;
  let firstSpaceAdmin: User;
  let firstSpaceMember: User;
  let firstSpaceMemberWithRole: User;
  let firstSpaceCustomRole: Role;

  let secondSpace: Space;
  let secondSpaceAdmin: User;
  let secondSpaceMember: User;

  // Pages content
  let firstSpacePageWithoutPermissions: Page;
  let firstSpacePageWithSpacePermission: Page;
  let firstSpacePageWithSpacePermissionAndPublicPermission: Page;
  let firstSpacePageWithRolePermission: Page;
  let firstSpacePageWithUserPermission: Page;
  let firstSpacePageWithPublicPermission: Page;

  let secondSpacePageWithoutPermissions: Page;
  let secondSpacePageWithSpacePermission: Page;
  let secondSpacePageWithSpacePermissionAndPublicPermission: Page;
  let secondSpacePageWithUserPermission: Page;

  let firstSpaceUsers: User[];
  let firstSpacePages: Page[];

  let secondSpaceUsers: User[];
  let secondSpacePages: Page[];

  let allUsers: User[];
  let allPages: Page[];

  beforeAll(async () => {
    const first = await testUtilsUser.generateUserAndSpace({ isAdmin: true });
    firstSpace = first.space;
    firstSpaceAdmin = first.user;
    firstSpaceMember = await testUtilsUser.generateSpaceUser({ spaceId: firstSpace.id });
    firstSpaceMemberWithRole = await testUtilsUser.generateSpaceUser({ spaceId: firstSpace.id });
    firstSpaceCustomRole = await testUtilsMembers.generateRole({
      createdBy: firstSpaceAdmin.id,
      spaceId: firstSpace.id,
      assigneeUserIds: [firstSpaceMemberWithRole.id]
    });

    const second = await testUtilsUser.generateUserAndSpace({ isAdmin: true });
    secondSpace = second.space;
    secondSpaceAdmin = second.user;
    secondSpaceMember = await testUtilsUser.generateSpaceUser({ spaceId: secondSpace.id });

    // Generate pages
    firstSpacePageWithoutPermissions = await testUtilsPages.generatePage({
      createdBy: firstSpaceAdmin.id,
      spaceId: firstSpace.id
    });
    firstSpacePageWithSpacePermission = await testUtilsPages.generatePage({
      createdBy: firstSpaceAdmin.id,
      spaceId: firstSpace.id,
      pagePermissions: [{ assignee: { group: 'space', id: firstSpace.id }, permissionLevel: 'full_access' }]
    });
    firstSpacePageWithSpacePermissionAndPublicPermission = await testUtilsPages.generatePage({
      createdBy: firstSpaceAdmin.id,
      spaceId: firstSpace.id,
      pagePermissions: [
        { assignee: { group: 'space', id: firstSpace.id }, permissionLevel: 'full_access' },
        { assignee: { group: 'public' }, permissionLevel: 'view' }
      ]
    });
    firstSpacePageWithRolePermission = await testUtilsPages.generatePage({
      createdBy: firstSpaceAdmin.id,
      spaceId: firstSpace.id,
      pagePermissions: [{ assignee: { group: 'role', id: firstSpaceCustomRole.id }, permissionLevel: 'full_access' }]
    });
    firstSpacePageWithUserPermission = await testUtilsPages.generatePage({
      createdBy: firstSpaceAdmin.id,
      spaceId: firstSpace.id,
      pagePermissions: [{ assignee: { group: 'user', id: firstSpaceMember.id }, permissionLevel: 'view' }]
    });
    firstSpacePageWithPublicPermission = await testUtilsPages.generatePage({
      createdBy: firstSpaceAdmin.id,
      spaceId: firstSpace.id,
      pagePermissions: [{ assignee: { group: 'public' }, permissionLevel: 'view' }]
    });
    secondSpacePageWithoutPermissions = await testUtilsPages.generatePage({
      createdBy: secondSpaceAdmin.id,
      spaceId: secondSpace.id
    });
    secondSpacePageWithSpacePermission = await testUtilsPages.generatePage({
      createdBy: secondSpaceAdmin.id,
      spaceId: secondSpace.id,
      pagePermissions: [{ assignee: { group: 'space', id: secondSpace.id }, permissionLevel: 'full_access' }]
    });
    secondSpacePageWithSpacePermissionAndPublicPermission = await testUtilsPages.generatePage({
      createdBy: secondSpaceAdmin.id,
      spaceId: secondSpace.id,
      pagePermissions: [
        { assignee: { group: 'space', id: secondSpace.id }, permissionLevel: 'full_access' },
        { assignee: { group: 'public' }, permissionLevel: 'view' }
      ]
    });
    secondSpacePageWithUserPermission = await testUtilsPages.generatePage({
      createdBy: secondSpaceAdmin.id,
      spaceId: secondSpace.id,
      pagePermissions: [{ assignee: { group: 'user', id: secondSpaceMember.id }, permissionLevel: 'view' }]
    });

    firstSpaceUsers = [firstSpaceAdmin, firstSpaceMember, firstSpaceMemberWithRole];
    firstSpacePages = [
      firstSpacePageWithoutPermissions,
      firstSpacePageWithSpacePermission,
      firstSpacePageWithSpacePermissionAndPublicPermission,
      firstSpacePageWithRolePermission,
      firstSpacePageWithUserPermission,
      firstSpacePageWithPublicPermission
    ];

    secondSpaceUsers = [secondSpaceAdmin, secondSpaceMember];
    secondSpacePages = [
      secondSpacePageWithoutPermissions,
      secondSpacePageWithSpacePermission,
      secondSpacePageWithSpacePermissionAndPublicPermission,
      secondSpacePageWithUserPermission
    ];

    allUsers = [...firstSpaceUsers, ...secondSpaceUsers];
    allPages = [...firstSpacePages, ...secondSpacePages];
  });

  it('should always return the same results as computePagePermissionsForFreeSpace for users outside the space', async () => {
    for (const user of secondSpaceUsers) {
      const bulkPermissions = await bulkComputePagePermissionsForFreeSpace({
        pageIds: firstSpacePages.map((page) => page.id),
        userId: user.id
      });

      for (const page of firstSpacePages) {
        const computedPermission = await computePagePermissionsForFreeSpace({ resourceId: page.id, userId: user.id });
        expect(bulkPermissions[page.id]).toEqual(computedPermission);
      }
    }

    for (const user of firstSpaceUsers) {
      const bulkPermissions = await bulkComputePagePermissionsForFreeSpace({
        pageIds: secondSpacePages.map((page) => page.id),
        userId: user.id
      });

      for (const page of secondSpacePages) {
        const computedPermission = await computePagePermissionsForFreeSpace({ resourceId: page.id, userId: user.id });
        expect(bulkPermissions[page.id]).toEqual(computedPermission);
      }
    }
  });

  it('should always return the same results as computePagePermissionsForFreeSpace for users inside the space', async () => {
    for (const user of secondSpaceUsers) {
      const bulkPermissions = await bulkComputePagePermissionsForFreeSpace({
        pageIds: secondSpacePages.map((page) => page.id),
        userId: user.id
      });

      for (const page of secondSpacePages) {
        const computedPermission = await computePagePermissionsForFreeSpace({ resourceId: page.id, userId: user.id });
        expect(bulkPermissions[page.id]).toEqual(computedPermission);
      }
    }

    for (const user of firstSpaceUsers) {
      const bulkPermissions = await bulkComputePagePermissionsForFreeSpace({
        pageIds: firstSpacePages.map((page) => page.id),
        userId: user.id
      });

      for (const page of firstSpacePages) {
        const computedPermission = await computePagePermissionsForFreeSpace({ resourceId: page.id, userId: user.id });
        expect(bulkPermissions[page.id]).toEqual(computedPermission);
      }
    }
  });

  it('should always return the same results as computePagePermissionsForFreeSpace for users when pages belong to multiple spaces', async () => {
    for (const user of allUsers) {
      const bulkPermissions = await bulkComputePagePermissionsForFreeSpace({
        pageIds: allPages.map((page) => page.id),
        userId: user.id
      });

      for (const page of allPages) {
        const computedPermission = await computePagePermissionsForFreeSpace({ resourceId: page.id, userId: user.id });
        expect(bulkPermissions[page.id]).toEqual(computedPermission);
      }
    }
  });

  it('should always return the same results as computePagePermissionsForFreeSpace for proposal pages', async () => {
    const firstSpaceDraftProposal = await testUtilsProposals.generateProposal({
      spaceId: firstSpace.id,
      userId: firstSpaceAdmin.id,
      proposalStatus: 'draft'
    });

    const firstSpaceDiscussionProposal = await testUtilsProposals.generateProposal({
      spaceId: firstSpace.id,
      userId: firstSpaceAdmin.id,
      proposalStatus: 'published'
    });

    const secondSpaceDraftProposal = await testUtilsProposals.generateProposal({
      spaceId: secondSpace.id,
      userId: secondSpaceAdmin.id,
      proposalStatus: 'draft'
    });

    const secondSpaceDiscussionProposal = await testUtilsProposals.generateProposal({
      spaceId: secondSpace.id,
      userId: secondSpaceAdmin.id,
      proposalStatus: 'published'
    });

    const { space: spaceWithPublicProposals, user: spaceWithPublicProposalsAdmin } =
      await testUtilsUser.generateUserAndSpace({
        isAdmin: true,
        publicProposals: true
      });

    const spaceWithPublicProposalsDraftProposal = await testUtilsProposals.generateProposal({
      spaceId: spaceWithPublicProposals.id,
      userId: spaceWithPublicProposalsAdmin.id,
      proposalStatus: 'draft'
    });

    const spaceWithPublicProposalsDiscussionProposal = await testUtilsProposals.generateProposal({
      spaceId: spaceWithPublicProposals.id,
      userId: spaceWithPublicProposalsAdmin.id,
      proposalStatus: 'published'
    });

    const allProposals = [
      firstSpaceDraftProposal,
      firstSpaceDiscussionProposal,
      secondSpaceDraftProposal,
      secondSpaceDiscussionProposal,
      spaceWithPublicProposalsDraftProposal,
      spaceWithPublicProposalsDiscussionProposal
    ];

    const allUsersForTestingProposals = [...allUsers, spaceWithPublicProposalsAdmin];

    for (let i = 0; i < allUsersForTestingProposals.length; i++) {
      const user = allUsersForTestingProposals[i];
      const bulkPermissions = await bulkComputePagePermissionsForFreeSpace({
        pageIds: allProposals.map((page) => page.id),
        userId: user.id
      });
      for (const proposal of allProposals) {
        const computedPermission = await computePagePermissionsForFreeSpace({
          resourceId: proposal.id,
          userId: user.id
        });
        expect(bulkPermissions[proposal.id]).toEqual(computedPermission);
      }
    }
  });
});
