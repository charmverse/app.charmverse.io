import type { Role, Space, User } from '@charmverse/core/prisma';
import { testUtilsBounties, testUtilsMembers, testUtilsUser } from '@charmverse/core/test';

import { isBountyPageEditableByApplicants } from '../isBountyPageEditableByApplicants';

let space: Space;
let bountyCreator: User;
let bountyCreatorWithRole: User;
let userWithoutRole: User;
let userWithRole: User;
let userWithSecondRole: User;
let assignedRole: Role;
let secondAssignedRole: Role;
let unassignedRole: Role;

beforeAll(async () => {
  const generated = await testUtilsUser.generateUserAndSpace({
    isAdmin: false
  });
  space = generated.space;
  bountyCreator = generated.user;

  bountyCreatorWithRole = await testUtilsUser.generateSpaceUser({
    spaceId: space.id,
    isAdmin: false
  });
  userWithRole = await testUtilsUser.generateSpaceUser({
    spaceId: space.id,
    isAdmin: false
  });

  userWithSecondRole = await testUtilsUser.generateSpaceUser({
    spaceId: space.id,
    isAdmin: false
  });

  userWithoutRole = await testUtilsUser.generateSpaceUser({
    spaceId: space.id,
    isAdmin: false
  });

  assignedRole = await testUtilsMembers.generateRole({
    createdBy: bountyCreator.id,
    spaceId: space.id,
    assigneeUserIds: [userWithRole.id, bountyCreatorWithRole.id]
  });

  secondAssignedRole = await testUtilsMembers.generateRole({
    createdBy: bountyCreator.id,
    spaceId: space.id,
    assigneeUserIds: [userWithSecondRole.id]
  });

  unassignedRole = await testUtilsMembers.generateRole({
    createdBy: bountyCreator.id,
    spaceId: space.id
  });
});
describe('isBountyPageEditableByApplicants', () => {
  it('should return true if the bounty allows the space to submit work, and there is a space wide page permission granting edit access', async () => {
    const bounty = await testUtilsBounties.generateBounty({
      approveSubmitters: true,
      createdBy: bountyCreator.id,
      spaceId: space.id,
      status: 'open',
      pagePermissions: [
        {
          permissionLevel: 'editor',
          assignee: { group: 'space', id: space.id }
        }
      ],
      bountyPermissions: {
        submitter: [
          {
            group: 'space',
            id: space.id
          }
        ]
      }
    });

    await expect(isBountyPageEditableByApplicants({ resourceId: bounty.page.id })).resolves.toMatchObject({
      editable: true
    });
  });

  it('should return true if the bounty allows only a specific role to submit work, and there is a space page permission granting edit access', async () => {
    const bounty = await testUtilsBounties.generateBounty({
      approveSubmitters: true,
      createdBy: bountyCreator.id,
      spaceId: space.id,
      status: 'open',
      pagePermissions: [
        {
          permissionLevel: 'editor',
          assignee: { group: 'space', id: space.id }
        }
      ],
      bountyPermissions: {
        submitter: [
          {
            group: 'role',
            id: assignedRole.id
          }
        ]
      }
    });
    await expect(isBountyPageEditableByApplicants({ resourceId: bounty.page.id })).resolves.toMatchObject({
      editable: true
    });
  });

  it('should return true if the bounty allows the space to submit work, and there is a role page permission granting edit access', async () => {
    const bounty = await testUtilsBounties.generateBounty({
      approveSubmitters: true,
      createdBy: bountyCreator.id,
      spaceId: space.id,
      status: 'open',
      pagePermissions: [
        {
          permissionLevel: 'editor',
          assignee: { group: 'role', id: assignedRole.id }
        }
      ],
      bountyPermissions: {
        submitter: [
          {
            group: 'space',
            id: space.id
          }
        ]
      }
    });
    await expect(isBountyPageEditableByApplicants({ resourceId: bounty.page.id })).resolves.toMatchObject({
      editable: true
    });
  });

  it('should return true if the bounty allows the space to submit work, and there is a user page permission granting edit access', async () => {
    const bounty = await testUtilsBounties.generateBounty({
      approveSubmitters: true,
      createdBy: bountyCreator.id,
      spaceId: space.id,
      status: 'open',
      pagePermissions: [
        {
          permissionLevel: 'editor',
          assignee: { group: 'user', id: userWithoutRole.id }
        }
      ],
      bountyPermissions: {
        submitter: [
          {
            group: 'space',
            id: space.id
          }
        ]
      }
    });
    await expect(isBountyPageEditableByApplicants({ resourceId: bounty.page.id })).resolves.toMatchObject({
      editable: true
    });
  });

  it('should return true if the bounty allows a role to submit work, and there is a user granted this role with individual page permission granting edit access', async () => {
    const bounty = await testUtilsBounties.generateBounty({
      approveSubmitters: true,
      createdBy: bountyCreator.id,
      spaceId: space.id,
      status: 'open',
      pagePermissions: [
        {
          permissionLevel: 'editor',
          assignee: { group: 'user', id: userWithRole.id }
        }
      ],
      bountyPermissions: {
        submitter: [
          {
            group: 'role',
            id: assignedRole.id
          }
        ]
      }
    });
    await expect(isBountyPageEditableByApplicants({ resourceId: bounty.page.id })).resolves.toMatchObject({
      editable: true
    });
  });

  it('should return true if the bounty allows a role to submit work, and there is a role with no members that has edit access', async () => {
    const bounty = await testUtilsBounties.generateBounty({
      approveSubmitters: true,
      createdBy: bountyCreator.id,
      spaceId: space.id,
      status: 'open',
      pagePermissions: [
        {
          permissionLevel: 'editor',
          assignee: { group: 'role', id: unassignedRole.id }
        }
      ],
      bountyPermissions: {
        submitter: [
          {
            group: 'role',
            id: unassignedRole.id
          }
        ]
      }
    });
    await expect(isBountyPageEditableByApplicants({ resourceId: bounty.page.id })).resolves.toMatchObject({
      editable: true
    });
  });

  it('should return true if the bounty allows a role to submit work, and there is a role permission granting edit access', async () => {
    const bounty = await testUtilsBounties.generateBounty({
      approveSubmitters: true,
      createdBy: bountyCreator.id,
      spaceId: space.id,
      status: 'open',
      pagePermissions: [
        {
          permissionLevel: 'editor',
          assignee: { group: 'role', id: assignedRole.id }
        }
      ],
      bountyPermissions: {
        submitter: [
          {
            group: 'role',
            id: assignedRole.id
          }
        ]
      }
    });
    await expect(isBountyPageEditableByApplicants({ resourceId: bounty.page.id })).resolves.toMatchObject({
      editable: true
    });
  });

  it('should return false if the only editor level permission is for the author', async () => {
    const bounty = await testUtilsBounties.generateBounty({
      approveSubmitters: true,
      createdBy: bountyCreator.id,
      spaceId: space.id,
      status: 'open',
      pagePermissions: [
        {
          permissionLevel: 'editor',
          assignee: { group: 'user', id: bountyCreator.id }
        }
      ],
      bountyPermissions: {
        submitter: [
          {
            group: 'space',
            id: space.id
          }
        ]
      }
    });

    await expect(isBountyPageEditableByApplicants({ resourceId: bounty.page.id })).resolves.toMatchObject({
      editable: false
    });
  });

  it('should return false if working on the bounty is restricted to a role that the author belongs to, and only the author can edit the page', async () => {
    const bounty = await testUtilsBounties.generateBounty({
      approveSubmitters: true,
      createdBy: bountyCreatorWithRole.id,
      spaceId: space.id,
      status: 'open',
      pagePermissions: [
        {
          permissionLevel: 'editor',
          assignee: { group: 'user', id: bountyCreator.id }
        }
      ],
      bountyPermissions: {
        submitter: [
          {
            group: 'role',
            id: assignedRole.id
          }
        ]
      }
    });
    await expect(isBountyPageEditableByApplicants({ resourceId: bounty.page.id })).resolves.toMatchObject({
      editable: false
    });
  });

  it('should return false if only a role can submit, and a different role has editor level page permissions', async () => {
    const bounty = await testUtilsBounties.generateBounty({
      approveSubmitters: true,
      createdBy: bountyCreator.id,
      spaceId: space.id,
      status: 'open',
      pagePermissions: [
        {
          permissionLevel: 'editor',
          assignee: { group: 'role', id: secondAssignedRole.id }
        },
        {
          permissionLevel: 'editor',
          assignee: { group: 'user', id: bountyCreator.id }
        }
      ],
      bountyPermissions: {
        submitter: [
          {
            group: 'role',
            id: assignedRole.id
          }
        ]
      }
    });

    await expect(isBountyPageEditableByApplicants({ resourceId: bounty.page.id })).resolves.toMatchObject({
      editable: false
    });
  });
});
