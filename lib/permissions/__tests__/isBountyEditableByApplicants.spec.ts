import type { Role, Space, User } from '@prisma/client';

import { prisma } from 'db';
import { getBounty } from 'lib/bounties';
import type { BountyWithDetails } from 'lib/bounties';
import { getSpaceMembers } from 'lib/members/getSpaceMembers';
import type { Member } from 'lib/members/interfaces';
import { assignRole } from 'lib/roles';
import {
  generateBounty,
  generateRole,
  generateSpaceUser,
  generateUserAndSpace,
  generateUserAndSpaceWithApiToken
} from 'testing/setupDatabase';

import type { BountyPermissionGroup } from '../bounties';
import { queryBountyPermissions } from '../bounties';
import { isBountyEditableByApplicants } from '../isBountyEditableByApplicants';

let space: Space;
let bountyCreator: User;
let bountyCreatorWithRole: User;
let userWithoutRole: User;
let userWithRole: User;
let userWithSecondRole: User;
let assignedRole: Role;
let secondAssignedRole: Role;
let unassignedRole: Role;

let members: Member[];
beforeAll(async () => {
  const generated = await generateUserAndSpace({
    isAdmin: false
  });
  space = generated.space;
  bountyCreator = generated.user;

  bountyCreatorWithRole = await generateSpaceUser({
    spaceId: space.id,
    isAdmin: false
  });
  userWithRole = await generateSpaceUser({
    spaceId: space.id,
    isAdmin: false
  });

  userWithSecondRole = await generateSpaceUser({
    spaceId: space.id,
    isAdmin: false
  });

  userWithoutRole = await generateSpaceUser({
    spaceId: space.id,
    isAdmin: false
  });

  assignedRole = await generateRole({
    createdBy: bountyCreator.id,
    spaceId: space.id,
    assigneeUserIds: [userWithRole.id, bountyCreatorWithRole.id]
  });

  secondAssignedRole = await generateRole({
    createdBy: bountyCreator.id,
    spaceId: space.id,
    assigneeUserIds: [userWithSecondRole.id]
  });

  unassignedRole = await generateRole({
    createdBy: bountyCreator.id,
    spaceId: space.id
  });

  members = await getSpaceMembers({
    spaceId: space.id
  });
});
describe('compareBountyPagePermissions', () => {
  it('should return true if the bounty allows the space to submit work, and there is a space wide page permission granting edit access', async () => {
    const bounty = await generateBounty({
      approveSubmitters: true,
      createdBy: bountyCreator.id,
      spaceId: space.id,
      status: 'open',
      pagePermissions: [
        {
          permissionLevel: 'editor',
          spaceId: space.id
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
    const [bountyPermissions, pagePermissions] = await Promise.all([
      queryBountyPermissions({ bountyId: bounty.id }),
      prisma.pagePermission.findMany({
        where: {
          pageId: bounty.id
        }
      })
    ]);

    expect(isBountyEditableByApplicants({ bounty, members, bountyPermissions, pagePermissions })).toBe(true);
  });

  it('should return true if the bounty allows only a specific role to submit work, and there is a space page permission granting edit access', async () => {
    const bounty = await generateBounty({
      approveSubmitters: true,
      createdBy: bountyCreator.id,
      spaceId: space.id,
      status: 'open',
      pagePermissions: [
        {
          permissionLevel: 'editor',
          spaceId: space.id
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
    const [bountyPermissions, pagePermissions] = await Promise.all([
      queryBountyPermissions({ bountyId: bounty.id }),
      prisma.pagePermission.findMany({
        where: {
          pageId: bounty.id
        }
      })
    ]);

    expect(isBountyEditableByApplicants({ bounty, members, bountyPermissions, pagePermissions })).toBe(true);
  });

  it('should return true if the bounty allows the space to submit work, and there is a role page permission granting edit access', async () => {
    const bounty = await generateBounty({
      approveSubmitters: true,
      createdBy: bountyCreator.id,
      spaceId: space.id,
      status: 'open',
      pagePermissions: [
        {
          permissionLevel: 'editor',
          roleId: assignedRole.id
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
    const [bountyPermissions, pagePermissions] = await Promise.all([
      queryBountyPermissions({ bountyId: bounty.id }),
      prisma.pagePermission.findMany({
        where: {
          pageId: bounty.id
        }
      })
    ]);

    expect(isBountyEditableByApplicants({ bounty, members, bountyPermissions, pagePermissions })).toBe(true);
  });

  it('should return true if the bounty allows the space to submit work, and there is a user page permission granting edit access', async () => {
    const bounty = await generateBounty({
      approveSubmitters: true,
      createdBy: bountyCreator.id,
      spaceId: space.id,
      status: 'open',
      pagePermissions: [
        {
          permissionLevel: 'editor',
          userId: userWithoutRole.id
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
    const [bountyPermissions, pagePermissions] = await Promise.all([
      queryBountyPermissions({ bountyId: bounty.id }),
      prisma.pagePermission.findMany({
        where: {
          pageId: bounty.id
        }
      })
    ]);

    expect(isBountyEditableByApplicants({ bounty, members, bountyPermissions, pagePermissions })).toBe(true);
  });

  it('should return true if the bounty allows a role to submit work, and there is a user granted this role with individual page permission granting edit access', async () => {
    const bounty = await generateBounty({
      approveSubmitters: true,
      createdBy: bountyCreator.id,
      spaceId: space.id,
      status: 'open',
      pagePermissions: [
        {
          permissionLevel: 'editor',
          userId: userWithRole.id
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
    const [bountyPermissions, pagePermissions] = await Promise.all([
      queryBountyPermissions({ bountyId: bounty.id }),
      prisma.pagePermission.findMany({
        where: {
          pageId: bounty.id
        }
      })
    ]);

    expect(isBountyEditableByApplicants({ bounty, members, bountyPermissions, pagePermissions })).toBe(true);
  });

  it('should return true if the bounty allows a role to submit work, and there is a role permission granting edit access', async () => {
    const bounty = await generateBounty({
      approveSubmitters: true,
      createdBy: bountyCreator.id,
      spaceId: space.id,
      status: 'open',
      pagePermissions: [
        {
          permissionLevel: 'editor',
          roleId: assignedRole.id
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
    const [bountyPermissions, pagePermissions] = await Promise.all([
      queryBountyPermissions({ bountyId: bounty.id }),
      prisma.pagePermission.findMany({
        where: {
          pageId: bounty.id
        }
      })
    ]);

    expect(isBountyEditableByApplicants({ bounty, members, bountyPermissions, pagePermissions })).toBe(true);
  });

  it('should return false if the only editor level permission is for the author', async () => {
    const bounty = await generateBounty({
      approveSubmitters: true,
      createdBy: bountyCreator.id,
      spaceId: space.id,
      status: 'open',
      pagePermissions: [
        {
          permissionLevel: 'editor',
          userId: bountyCreator.id
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

    const [bountyPermissions, pagePermissions] = await Promise.all([
      queryBountyPermissions({ bountyId: bounty.id }),
      prisma.pagePermission.findMany({
        where: {
          pageId: bounty.id
        }
      })
    ]);

    expect(isBountyEditableByApplicants({ bounty, members, bountyPermissions, pagePermissions })).toBe(false);
  });

  it('should return false if the bounty is restricted to a role that the author belongs to', async () => {
    const bounty = await generateBounty({
      approveSubmitters: true,
      createdBy: bountyCreatorWithRole.id,
      spaceId: space.id,
      status: 'open',
      pagePermissions: [
        {
          permissionLevel: 'editor',
          userId: bountyCreator.id
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

    const [bountyPermissions, pagePermissions] = await Promise.all([
      queryBountyPermissions({ bountyId: bounty.id }),
      prisma.pagePermission.findMany({
        where: {
          pageId: bounty.id
        }
      })
    ]);

    expect(isBountyEditableByApplicants({ bounty, members, bountyPermissions, pagePermissions })).toBe(false);
  });

  it('should return false if only a role can submit, and a different role has editor level page permissions', async () => {
    const bounty = await generateBounty({
      approveSubmitters: true,
      createdBy: bountyCreator.id,
      spaceId: space.id,
      status: 'open',
      pagePermissions: [
        {
          permissionLevel: 'editor',
          roleId: secondAssignedRole.id
        },
        {
          permissionLevel: 'editor',
          userId: bountyCreator.id
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

    const [bountyPermissions, pagePermissions] = await Promise.all([
      queryBountyPermissions({ bountyId: bounty.id }),
      prisma.pagePermission.findMany({
        where: {
          pageId: bounty.id
        }
      })
    ]);

    expect(isBountyEditableByApplicants({ bounty, members, bountyPermissions, pagePermissions })).toBe(false);
  });
});
