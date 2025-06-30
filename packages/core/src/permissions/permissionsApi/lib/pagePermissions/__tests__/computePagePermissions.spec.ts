import { generateProposal } from '@charmverse/core/dist/cjs/lib/testing/proposals';
import type { Space, User } from '@charmverse/core/prisma';
import { PageOperations } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import {
  testUtilsBounties,
  testUtilsMembers,
  testUtilsPages,
  testUtilsProposals,
  testUtilsUser
} from '@charmverse/core/test';
import { DataNotFoundError } from '@packages/core/errors';
import { AvailablePagePermissions } from '@packages/core/permissions';
import { objectUtils } from '@packages/core/utilities';
import { v4 as uuid } from 'uuid';

import { computeProposalNotePermissions } from '../../proposalPermissions/computeProposalNotePermissions';
import { computePagePermissions } from '../computePagePermissions';
import { permissionTemplates } from '../mapping';

let user: User;
let space: Space;
beforeAll(async () => {
  const generated = await testUtilsUser.generateUserAndSpace();
  user = generated.user;
  space = generated.space;
});

describe('computePagePermissions', () => {
  // This test exists so we can apply a certain permission level to the space, but make it higher or lower for a user
  it('should apply permissions to the user in priority of user, role and space', async () => {
    const localUser = await testUtilsUser.generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    });

    const otherLocalUser = await testUtilsUser.generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    });

    const role = await testUtilsMembers.generateRole({
      createdBy: user.id,
      spaceId: space.id,
      assigneeUserIds: [localUser.id]
    });

    // Perform the test with a page that has role / space / permissions ----------------------------
    const firstPage = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      pagePermissions: [
        {
          permissionLevel: 'full_access',
          assignee: { group: 'space', id: space.id }
        },
        {
          permissionLevel: 'view_comment',
          assignee: { group: 'role', id: role.id }
        }
      ]
    });

    const firstPagePermissions = await computePagePermissions({
      resourceId: firstPage.id,
      userId: localUser.id
    });

    // Check that the level assigned to the role was used in the compute
    objectUtils.typedKeys(PageOperations).forEach((op) => {
      if (permissionTemplates.view_comment.includes(op)) {
        expect(firstPagePermissions[op]).toBe(true);
      } else {
        expect(firstPagePermissions[op]).toBe(false);
      }
    });

    // Check that other space members not belonging to the role continue to receive the space level permissions
    const otherFirstPagePermissions = await computePagePermissions({
      resourceId: firstPage.id,
      userId: otherLocalUser.id
    });

    objectUtils.typedKeys(PageOperations).forEach((op) => {
      expect(otherFirstPagePermissions[op]).toBe(true);
    });

    // Perform the test with a page that has user/ role / space / permissions ----------------------------
    const secondPage = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      pagePermissions: [
        {
          permissionLevel: 'view_comment',
          assignee: { group: 'space', id: space.id }
        },
        {
          permissionLevel: 'full_access',
          assignee: { group: 'role', id: role.id }
        },
        {
          permissionLevel: 'view',
          assignee: { group: 'user', id: localUser.id }
        }
      ]
    });

    const permissions = await computePagePermissions({
      resourceId: secondPage.id,
      userId: localUser.id
    });

    // Check that the level assigned to the role was used in the compute
    objectUtils.typedKeys(PageOperations).forEach((op) => {
      if (permissionTemplates.view.includes(op)) {
        expect(permissions[op]).toBe(true);
      } else {
        expect(permissions[op]).toBe(false);
      }
    });

    // Check that other space members are receiving the space level permissions
    const otherPermissions = await computePagePermissions({
      resourceId: secondPage.id,
      userId: otherLocalUser.id
    });

    objectUtils.typedKeys(PageOperations).forEach((op) => {
      if (permissionTemplates.view_comment.includes(op)) {
        expect(otherPermissions[op]).toBe(true);
      } else {
        expect(otherPermissions[op]).toBe(false);
      }
    });
  });

  it('should provide the user with a delete permission if they have the delete any page permission, and the page is not of type proposal or bounty', async () => {
    const { user: localAdminUser, space: localSpace } = await testUtilsUser.generateUserAndSpace({
      isAdmin: true
    });

    const spaceMember = await testUtilsUser.generateSpaceUser({
      spaceId: localSpace.id,
      isAdmin: false
    });

    const spaceMemberWithRole = await testUtilsUser.generateSpaceUser({
      spaceId: localSpace.id,
      isAdmin: false
    });

    const role = await testUtilsMembers.generateRole({
      createdBy: localAdminUser.id,
      spaceId: localSpace.id,
      assigneeUserIds: [spaceMemberWithRole.id],
      spacePermissions: ['deleteAnyPage']
    });

    const documentPage = await testUtilsPages.generatePage({
      createdBy: localAdminUser.id,
      spaceId: localSpace.id,
      type: 'page'
    });

    const documentPagememberPermissions = await computePagePermissions({
      resourceId: documentPage.id,
      userId: spaceMember.id
    });

    const documentPagememberWithRolePermissions = await computePagePermissions({
      resourceId: documentPage.id,
      userId: spaceMemberWithRole.id
    });

    expect(documentPagememberPermissions.delete).toBe(false);
    expect(documentPagememberWithRolePermissions.delete).toBe(true);

    const boardPage = await testUtilsPages.generatePage({
      createdBy: localAdminUser.id,
      spaceId: localSpace.id,
      type: 'board'
    });

    const boardPagememberPermissions = await computePagePermissions({
      resourceId: boardPage.id,
      userId: spaceMember.id
    });

    const boardPagememberWithRolePermissions = await computePagePermissions({
      resourceId: boardPage.id,
      userId: spaceMemberWithRole.id
    });

    expect(boardPagememberPermissions.delete).toBe(false);
    expect(boardPagememberWithRolePermissions.delete).toBe(true);

    const proposalPage = await testUtilsProposals.generateProposal({
      userId: localAdminUser.id,
      spaceId: localSpace.id
    });

    const proposalPagememberPermissions = await computePagePermissions({
      resourceId: proposalPage.id,
      userId: spaceMember.id
    });

    const proposalPagememberWithRolePermissions = await computePagePermissions({
      resourceId: proposalPage.id,
      userId: spaceMemberWithRole.id
    });

    expect(proposalPagememberPermissions.delete).toBe(false);
    expect(proposalPagememberWithRolePermissions.delete).toBe(false);

    const bountyPage = await testUtilsBounties.generateBounty({
      spaceId: localSpace.id,
      createdBy: localAdminUser.id,
      type: 'bounty',
      approveSubmitters: false,
      status: 'open'
    });

    const bountyPagememberPermissions = await computePagePermissions({
      resourceId: bountyPage.id,
      userId: spaceMember.id
    });

    const bountyPagememberWithRolePermissions = await computePagePermissions({
      resourceId: bountyPage.id,
      userId: spaceMemberWithRole.id
    });

    expect(bountyPagememberPermissions.delete).toBe(false);
    expect(bountyPagememberWithRolePermissions.delete).toBe(false);

    const cardPageWithAttachedBounty = await testUtilsPages.generatePage({
      createdBy: localAdminUser.id,
      spaceId: localSpace.id
    });

    const cardPageWithAttachedBountymemberPermissions = await computePagePermissions({
      resourceId: cardPageWithAttachedBounty.id,
      userId: spaceMember.id
    });

    const cardPageWithAttachedBountymemberWithRolePermissions = await computePagePermissions({
      resourceId: cardPageWithAttachedBounty.id,
      userId: spaceMemberWithRole.id
    });

    expect(cardPageWithAttachedBountymemberPermissions.delete).toBe(false);
    // User can still delete the page since it's not a bounty, but a page with an attached bounty
    expect(cardPageWithAttachedBountymemberWithRolePermissions.delete).toBe(true);
  });

  it('should allow a user with the deleteAnyProposal permission to delete a proposal page', async () => {
    const { user: localUser, space: localSpace } = await testUtilsUser.generateUserAndSpace({
      isAdmin: false
    });

    const spaceMember = await testUtilsUser.generateSpaceUser({
      spaceId: localSpace.id,
      isAdmin: false
    });

    const role = await testUtilsMembers.generateRole({
      createdBy: localUser.id,
      spaceId: localSpace.id,
      assigneeUserIds: [spaceMember.id],
      spacePermissions: ['deleteAnyProposal']
    });

    const testProposal = await testUtilsProposals.generateProposal({
      spaceId: localSpace.id,
      userId: localUser.id,
      proposalStatus: 'draft'
    });
    const memberWithRolePermissions = await computePagePermissions({
      resourceId: testProposal.id,
      userId: spaceMember.id
    });

    expect(memberWithRolePermissions.delete).toBe(true);
  });

  it('should return full permissions if the user is an admin of the space linked to the page', async () => {
    const { user: adminUser, space: localSpace } = await testUtilsUser.generateUserAndSpace({
      isAdmin: true
    });

    const page = await testUtilsPages.generatePage({
      createdBy: adminUser.id,
      spaceId: localSpace.id,
      title: 'Page without permissions'
    });

    const permissions = await computePagePermissions({
      resourceId: page.id,
      userId: adminUser.id
    });

    (Object.keys(PageOperations) as PageOperations[]).forEach((op) => {
      expect(permissions[op]).toBe(true);
    });
  });

  it('should throw an error if the page does not exist', async () => {
    const inexistentPageId = uuid();

    await expect(
      computePagePermissions({
        resourceId: inexistentPageId,
        userId: user.id
      })
    ).rejects.toBeInstanceOf(DataNotFoundError);
  });

  it('should return only public permissions if no user is provided', async () => {
    const { user: nonAdminUser, space: localSpace } = await testUtilsUser.generateUserAndSpace({ isAdmin: true });

    const page = await testUtilsPages.generatePage({
      createdBy: nonAdminUser.id,
      spaceId: localSpace.id,
      title: 'Page without permissions',
      pagePermissions: [
        {
          permissionLevel: 'full_access',
          assignee: {
            group: 'space',
            id: localSpace.id
          }
        },
        {
          permissionLevel: 'view',
          assignee: {
            group: 'public'
          }
        }
      ]
    });
    const permissions = await computePagePermissions({
      resourceId: page.id
    });

    permissionTemplates.view.forEach((op) => {
      expect(permissions[op]).toBe(true);
    });

    expect(permissions.grant_permissions).toBe(false);
    expect(permissions.edit_content).toBe(false);
  });

  it('should only take into account individually assigned permissions for guest users', async () => {
    const { user: nonAdminUser, space: localSpace } = await testUtilsUser.generateUserAndSpace({});

    const guest = await testUtilsUser.generateSpaceUser({
      spaceId: localSpace.id,
      isGuest: true
    });

    const pageWithoutGuestPermissions = await testUtilsPages.generatePage({
      createdBy: nonAdminUser.id,
      spaceId: localSpace.id,
      title: 'Page without guest permissions',
      pagePermissions: [
        {
          permissionLevel: 'full_access',
          assignee: { group: 'space', id: localSpace.id }
        }
      ]
    });
    const permissions = await computePagePermissions({
      resourceId: pageWithoutGuestPermissions.id,
      userId: guest.id
    });

    objectUtils.typedKeys(PageOperations).forEach((op) => {
      expect(permissions[op]).toBe(false);
    });

    // Now add a permission for the guest user and check that it is taken into account
    const pageWithGuestPermissions = await testUtilsPages.generatePage({
      createdBy: nonAdminUser.id,
      spaceId: localSpace.id,
      title: 'Page without permissions',
      pagePermissions: [
        {
          permissionLevel: 'view',
          assignee: { group: 'space', id: localSpace.id }
        },
        {
          permissionLevel: 'full_access',
          assignee: { group: 'user', id: guest.id }
        }
      ]
    });
    const guestPermissions = await computePagePermissions({
      resourceId: pageWithGuestPermissions.id,
      userId: guest.id
    });

    permissionTemplates.full_access.forEach((op) => {
      expect(guestPermissions[op]).toBe(true);
    });
  });
  it('should take into account public permissions for a guest user', async () => {
    const guest = await testUtilsUser.generateSpaceUser({
      isGuest: true,
      spaceId: space.id
    });

    const page = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      pagePermissions: [
        {
          assignee: { group: 'public' },
          permissionLevel: 'view'
        }
      ]
    });

    const permissions = await computePagePermissions({
      resourceId: page.id,
      userId: guest.id
    });

    expect(permissions).toMatchObject(
      expect.objectContaining({
        ...new AvailablePagePermissions({ isReadonlySpace: false }).empty,
        read: true
      })
    );
  });
});
describe('computePagePermissions - with converted to proposal policy', () => {
  it('should not change admin permissions if page has been converted to a proposal', async () => {
    const { user: adminUser, space: localSpace } = await testUtilsUser.generateUserAndSpace({ isAdmin: true });

    const page = await testUtilsPages.generatePage({
      createdBy: adminUser.id,
      spaceId: localSpace.id,
      title: 'Page without permissions',
      pagePermissions: [
        {
          permissionLevel: 'full_access',
          assignee: { group: 'space', id: space.id }
        },
        {
          permissionLevel: 'view',
          assignee: { group: 'public' }
        }
      ]
    });

    const proposal = await testUtilsProposals.generateProposal({ spaceId: localSpace.id, userId: adminUser.id });
    await prisma.page.update({
      where: {
        id: page.id
      },
      data: {
        convertedProposalId: proposal.id
      }
    });

    const permissions = await computePagePermissions({
      resourceId: page.id,
      userId: adminUser.id
    });

    expect(permissions).toMatchObject(new AvailablePagePermissions({ isReadonlySpace: false }).full);
  });

  it('should return only read permissions for space members if page has been converted to a proposal', async () => {
    const { user: nonAdminUser, space: localSpace } = await testUtilsUser.generateUserAndSpace({ isAdmin: false });
    const page = await testUtilsPages.generatePage({
      createdBy: nonAdminUser.id,
      spaceId: localSpace.id,
      title: 'Page without permissions',
      pagePermissions: [
        {
          permissionLevel: 'full_access',
          assignee: { group: 'space', id: space.id }
        },
        {
          permissionLevel: 'view',
          assignee: { group: 'public' }
        }
      ]
    });

    const proposal = await testUtilsProposals.generateProposal({ spaceId: localSpace.id, userId: nonAdminUser.id });
    await prisma.page.update({
      where: {
        id: page.id
      },
      data: {
        convertedProposalId: proposal.id
      }
    });

    const permissions = await computePagePermissions({
      resourceId: page.id,
      userId: nonAdminUser.id
    });

    permissionTemplates.view.forEach((op) => {
      expect(permissions[op]).toBe(true);
    });

    expect(permissions.grant_permissions).toBe(false);
    expect(permissions.edit_content).toBe(false);
  });
});

describe('computePagePermissions - with locked page', () => {
  it('should remove edit permissions if the page is locked', async () => {
    const { space: testSpace, user: admin } = await testUtilsUser.generateUserAndSpace({ isAdmin: true });

    const page = await testUtilsPages.generatePage({
      isLocked: true,
      spaceId: testSpace.id,
      createdBy: admin.id
    });

    const permissions = await computePagePermissions({
      resourceId: page.id,
      userId: admin.id
    });

    expect(permissions).toMatchObject({
      ...new AvailablePagePermissions({ isReadonlySpace: false }).empty,
      read: true,
      comment: true,
      edit_position: true,
      grant_permissions: true,
      edit_lock: true
    });
  });
});

describe('computePagePermissions - proposal_notes', () => {
  it('should delegate computation to proposal notes compute', async () => {
    const { space: spaceWithProposalNotes, user: admin } = await testUtilsUser.generateUserAndSpace({ isAdmin: true });

    const member = await testUtilsUser.generateSpaceUser({ spaceId: spaceWithProposalNotes.id });

    const proposal = await testUtilsProposals.generateProposal({
      spaceId: spaceWithProposalNotes.id,
      userId: admin.id,
      proposalStatus: 'published',
      evaluationInputs: [
        {
          evaluationType: 'rubric',
          permissions: [],
          reviewers: [{ group: 'user', id: member.id }]
        }
      ]
    });

    const notes = await testUtilsProposals.generateProposalNotes({
      proposalPageId: proposal.page.id
    });

    const permissions = await computePagePermissions({
      resourceId: notes.id,
      userId: member.id
    });

    const computedProposalNotesPermissions = await computeProposalNotePermissions({
      resourceId: notes.id,
      userId: member.id
    });

    // Quick sanity check on some basic operations for this page which has no permissions
    expect(permissions.read).toBe(true);
    expect(permissions.comment).toBe(true);

    // Check that the computed permissions are the same as the ones returned by the compute function
    expect(permissions).toMatchObject(computedProposalNotesPermissions);
  });
});

describe('computePagePermissions - proposal templates', () => {
  let proposalSpace: Space;
  let spaceAdmin: User;
  let spaceMember: User;

  beforeAll(async () => {
    ({ user: spaceAdmin, space: proposalSpace } = await testUtilsUser.generateUserAndSpace({ isAdmin: true }));
    spaceMember = await testUtilsUser.generateSpaceUser({ spaceId: proposalSpace.id });
  });

  it('should return full permissions for space admins', async () => {
    const proposalTemplate = await testUtilsPages.generatePage({
      createdBy: spaceAdmin.id,
      spaceId: proposalSpace.id,
      type: 'proposal_template'
    });

    const permissions = await computePagePermissions({
      resourceId: proposalTemplate.id,
      userId: spaceAdmin.id
    });

    expect(permissions).toMatchObject(new AvailablePagePermissions({ isReadonlySpace: false }).full);
  });

  it('should return read permissions for space members', async () => {
    const proposalTemplate = await testUtilsPages.generatePage({
      createdBy: spaceAdmin.id,
      spaceId: proposalSpace.id,
      type: 'proposal_template'
    });

    const permissions = await computePagePermissions({
      resourceId: proposalTemplate.id,
      userId: spaceMember.id
    });

    expect(permissions).toMatchObject(
      new AvailablePagePermissions({ isReadonlySpace: false }).addPermissions(['read']).operationFlags
    );
  });

  it('should return read permissions for non-space members if public proposal templates is true', async () => {
    const { space: spaceWithPublicProposals, user: spaceWithPublicProposalsAdmin } =
      await testUtilsUser.generateUserAndSpace({
        isAdmin: true,
        publicProposalTemplates: true
      });

    const proposalTemplate = await testUtilsPages.generatePage({
      createdBy: spaceWithPublicProposalsAdmin.id,
      spaceId: spaceWithPublicProposals.id,
      type: 'proposal_template'
    });

    const permissions = await computePagePermissions({
      resourceId: proposalTemplate.id,
      userId: undefined
    });

    expect(permissions).toMatchObject(
      new AvailablePagePermissions({ isReadonlySpace: false }).addPermissions(['read']).operationFlags
    );
  });

  it('should return empty permissions for non-space members if public proposal templates is false', async () => {
    const proposalTemplate = await testUtilsPages.generatePage({
      createdBy: spaceAdmin.id,
      spaceId: proposalSpace.id,
      type: 'proposal_template'
    });

    const permissions = await computePagePermissions({
      resourceId: proposalTemplate.id,
      userId: undefined
    });

    expect(permissions).toMatchObject(new AvailablePagePermissions({ isReadonlySpace: false }).empty);
  });
});
