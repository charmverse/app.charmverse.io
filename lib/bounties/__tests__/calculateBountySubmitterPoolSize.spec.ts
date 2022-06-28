import { Role, Space, User } from '@prisma/client';
import { generateBounty, generateRole, generateSpaceUser, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { assignRole } from 'lib/roles';
import { LoggedInUser } from 'models';
import { setBountyPermissions } from 'lib/permissions/bounties';
import { v4 } from 'uuid';
import { DataNotFoundError } from 'lib/utilities/errors';
import { prisma } from 'db';
import { calculateBountySubmitterPoolSize } from '../calculateBountySubmitterPoolSize';

let nonAdminUser: User;
let space: Space;
const users: LoggedInUser[] = [];

let employees: Role;
let managers: Role;
let executives: Role;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(undefined, false);
  nonAdminUser = generated.user;
  space = generated.space;

  const prismaSpace = await prisma.spaceRole.findMany({
    where: {
      spaceId: space.id
    }
  });

  const generatedUsers: Promise<LoggedInUser>[] = [];

  for (let i = 0; i < 10; i++) {
    generatedUsers.push(generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    }).then(user => {
      users.push(user);
      return user;
    }));
  }

  await Promise.all(generatedUsers);

  const [employeeRole, managerRole, executiveRole] = await Promise.all([generateRole({
    spaceId: space.id,
    createdBy: nonAdminUser.id,
    roleName: 'employee'
  }),
  generateRole({
    spaceId: space.id,
    createdBy: nonAdminUser.id,
    roleName: 'manager'
  }),
  generateRole({
    spaceId: space.id,
    createdBy: nonAdminUser.id,
    roleName: 'executive'
  })]);

  employees = employeeRole;
  managers = managerRole;
  executives = executiveRole;

  await Promise.all(
    users.slice(0, 5).map(u => {
      return assignRole({
        roleId: employeeRole.id,
        userId: u.id
      });
    })
  );

  await Promise.all(
    users.slice(5, 8).map(u => {
      return assignRole({
        roleId: managerRole.id,
        userId: u.id
      });
    })
  );

  await Promise.all(
    users.slice(8, 9).map(u => {
      return assignRole({
        roleId: executiveRole.id,
        userId: u.id
      });
    })
  );

});

/**
 * These tests presume an 11 person team + 12th shadow user which is the bot user for space API token
 * - 1 without role
 * - 5 employees,
 * - 3 managers
 * - 2 executives
 */

describe('calculateBountySubmitterPoolSize', () => {
  // Since we use generateUserAndSpaceWithApiToken, we are also generating a bot user each time
  it('If the bounty can be worked on by all space members, it returns the total number of members in the space, ignoring the bot user.', async () => {
    const bounty = await generateBounty({
      spaceId: space.id,
      createdBy: nonAdminUser.id,
      approveSubmitters: false,
      status: 'open',
      maxSubmissions: 1
    });

    await setBountyPermissions({
      bountyId: bounty.id,
      permissionsToAssign: [{
        level: 'submitter',
        assignee: {
          group: 'space',
          id: space.id
        }
      }]
    });

    const bountySize = await calculateBountySubmitterPoolSize({
      bountyId: bounty.id
    });

    expect(bountySize.total).toBe(11);
    expect(bountySize.mode).toBe('space');

    // Should return empty roles rollup
    expect(bountySize.roleups.length).toBe(0);

  });

  it('If the bounty is restricted to certain roles, it should return the name of each role that can work on the bounty and the count of members with this role', async () => {
    const bounty = await generateBounty({
      spaceId: space.id,
      createdBy: nonAdminUser.id,
      approveSubmitters: false,
      status: 'open',
      maxSubmissions: 1
    });

    await setBountyPermissions({
      bountyId: bounty.id,
      permissionsToAssign: [{
        level: 'submitter',
        assignee: {
          group: 'role',
          id: employees.id
        }
      }]
    });

    const bountySize = await calculateBountySubmitterPoolSize({
      bountyId: bounty.id
    });

    expect(bountySize.total).toBe(5);
    expect(bountySize.mode).toBe('role');

    expect(bountySize.roleups.length).toBe(1);
    expect(bountySize.roleups[0].name).toBe('employee');
    expect(bountySize.roleups[0].members).toBe(5);

  });

  it('should perform the count with simulated permissions instead of the current bounty permissions', async () => {
    const bounty = await generateBounty({
      spaceId: space.id,
      createdBy: nonAdminUser.id,
      approveSubmitters: false,
      status: 'open',
      maxSubmissions: 1
    });

    await setBountyPermissions({
      bountyId: bounty.id,
      permissionsToAssign: [{
        level: 'submitter',
        assignee: {
          group: 'role',
          id: employees.id
        }
      }]
    });

    const bountySize = await calculateBountySubmitterPoolSize({
      bountyId: bounty.id,
      permissions: {
        submitter: [{
          group: 'space',
          id: space.id
        }]
      }
    });

    expect(bountySize.total).toBe(11);
    expect(bountySize.mode).toBe('space');

    expect(bountySize.roleups.length).toBe(0);
  });

  it('should only include the count permissions that grant access to the "work" operation', async () => {
    const bounty = await generateBounty({
      spaceId: space.id,
      createdBy: nonAdminUser.id,
      approveSubmitters: false,
      status: 'open',
      maxSubmissions: 1
    });

    const bountySize = await calculateBountySubmitterPoolSize({
      bountyId: bounty.id,
      permissions: {
        viewer: [{
          group: 'space',
          id: space.id
        }]
      }
    });

    expect(bountySize.total).toBe(0);
  });

  it('should fail if the bounty does not exist', async () => {
    await (expect(calculateBountySubmitterPoolSize({
      bountyId: v4()
    })).rejects.toBeInstanceOf(DataNotFoundError));
  });
});
