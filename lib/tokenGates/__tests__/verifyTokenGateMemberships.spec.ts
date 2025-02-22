import type { Space, User } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { generateUserAndSpace } from '@packages/testing/setupDatabase';
import { clearTokenGateData, deleteTokenGate, generateTokenGate } from '@packages/testing/utils/tokenGates';
import { applyTokenGates } from '@root/lib/tokenGates/applyTokenGates';
import { verifyTokenGateMemberships } from '@root/lib/tokenGates/verifyTokenGateMemberships';
import { walletAddress } from 'stories/lib/mockTokenGataData';

async function getSpaceUser({ spaceId, userId }: { spaceId: string; userId: string }) {
  return prisma.spaceRole.findUnique({
    where: {
      spaceUser: {
        spaceId,
        userId
      }
    }
  });
}

jest.mock('lib/tokenGates/validateTokenGateConditionWithDelegates', () => ({
  validateTokenGateConditionWithDelegates: jest.fn().mockResolvedValue(true)
}));

describe('verifyTokenGateMemberships', () => {
  let user: User;
  let user2: User;
  let space: Space;
  let space2: Space;

  beforeEach(async () => {
    const { user: u, space: s } = await generateUserAndSpace({ walletAddress });
    const { user: u2, space: s2 } = await generateUserAndSpace({
      walletAddress: '0x66525057AC951a0DB5C9fa7fAC6E056D6b8997E2'
    });
    user = u;
    space = s;
    user2 = u2;
    space2 = s2;
  });

  afterEach(async () => {
    await clearTokenGateData();
    await prisma.user.deleteMany({
      where: {
        id: {
          in: [user.id, user2.id]
        }
      }
    });
    jest.resetModules();
  });

  it('should not remove users without token gates', async () => {
    const res = await verifyTokenGateMemberships();

    const spaceUser1 = await getSpaceUser({ spaceId: space.id, userId: user.id });
    const spaceUser2 = await getSpaceUser({ spaceId: space2.id, userId: user2.id });

    expect(res).toEqual({ removedRoles: 0, removedMembers: 0 });
    expect(spaceUser1).not.toBeNull();
    expect(spaceUser2).not.toBeNull();
  });

  it('should not verify and remove user connected via deleted token gate', async () => {
    const tokenGate = await generateTokenGate({ userId: user.id, spaceId: space.id });

    await applyTokenGates({
      spaceId: space.id,
      userId: user.id,
      commit: true,
      tokenGateIds: [tokenGate.id]
    });
    await deleteTokenGate(tokenGate.id);

    const tokenGate2 = await generateTokenGate({ userId: user2.id, spaceId: space2.id });

    await applyTokenGates({
      spaceId: space2.id,
      userId: user2.id,
      commit: true,
      tokenGateIds: [tokenGate2.id]
    });

    const res = await verifyTokenGateMemberships();

    const spaceUser1 = await getSpaceUser({ spaceId: space.id, userId: user.id });
    const spaceUser2 = await getSpaceUser({ spaceId: space2.id, userId: user2.id });

    expect(res).toEqual({ removedRoles: 0, removedMembers: 1 });
    expect(spaceUser1).toBeNull();
    expect(spaceUser2).not.toBeNull();
  });

  it('should remove multi-space user from a proper space', async () => {
    const tokenGate = await generateTokenGate({ userId: user.id, spaceId: space.id });

    await applyTokenGates({
      spaceId: space.id,
      userId: user.id,
      commit: true,
      tokenGateIds: [tokenGate.id]
    });
    await deleteTokenGate(tokenGate.id);

    const tokenGate2 = await generateTokenGate({ userId: user.id, spaceId: space2.id });

    await applyTokenGates({
      spaceId: space2.id,
      userId: user.id,
      commit: true,
      tokenGateIds: [tokenGate2.id]
    });

    const res = await verifyTokenGateMemberships();

    const spaceUser1 = await getSpaceUser({ spaceId: space.id, userId: user.id });
    const spaceUser2 = await getSpaceUser({ spaceId: space2.id, userId: user.id });

    expect(res).toEqual({ removedRoles: 0, removedMembers: 1 });
    expect(spaceUser1).toBeNull();
    expect(spaceUser2).not.toBeNull();
  });
});
