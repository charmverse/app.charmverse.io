import type { Space, User } from '@charmverse/core/prisma';

import { assignRole } from 'lib/roles';
import { updateTokenGateRoles } from 'lib/tokenGates/updateTokenGateRoles';
import { randomETHWallet } from 'lib/utils/blockchain';
import type { LoggedInUser } from 'models';
import { generateRole, generateUserAndSpace } from 'testing/setupDatabase';
import { generateTokenGate } from 'testing/utils/tokenGates';

jest.mock('lib/tokenGates/validateTokenGateCondition', () => ({
  validateTokenGateConditionWithDelegates: jest.fn().mockResolvedValue(true)
}));

describe('reevaluateRoles', () => {
  let user: User;
  let space: Space;

  beforeEach(async () => {
    const { user: u, space: s } = await generateUserAndSpace({
      isAdmin: true,
      walletAddress: randomETHWallet().address
    });
    user = u;
    space = s;
  });

  it('should not add any roles if space does not have any token gate', async () => {
    const { reevaluateRoles } = await import('../reevaluateRoles');

    const res = await reevaluateRoles({
      spaceId: space.id,
      userId: user.id
    });

    expect(res.length).toBe(0);
  });

  it('should add roles from eligible token gate', async () => {
    const { reevaluateRoles } = await import('../reevaluateRoles');

    const tokenGate = await generateTokenGate({ userId: user.id, spaceId: space.id });
    const role1 = await generateRole({ spaceId: space.id, createdBy: user.id });
    const role2 = await generateRole({ spaceId: space.id, createdBy: user.id });

    await updateTokenGateRoles([role1.id, role2.id], tokenGate.id);

    const res = await reevaluateRoles({
      spaceId: space.id,
      userId: user.id
    });

    expect(res.length).toBe(2);
  });

  it('should only add missing roles', async () => {
    const { reevaluateRoles } = await import('../reevaluateRoles');

    const tokenGate = await generateTokenGate({ userId: user.id, spaceId: space.id });
    const role1 = await generateRole({ spaceId: space.id, createdBy: user.id });
    const role2 = await generateRole({ spaceId: space.id, createdBy: user.id });
    await updateTokenGateRoles([role1.id, role2.id], tokenGate.id);
    await assignRole({ roleId: role1.id, userId: user.id });

    const res = await reevaluateRoles({
      spaceId: space.id,
      userId: user.id
    });

    expect(res.length).toBe(1);
    expect(res[0]).toBe(role2.id);
  });
});
