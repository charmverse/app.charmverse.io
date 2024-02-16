import { prisma } from '@charmverse/core/prisma-client';

import { applyTokenGates } from 'lib/tokenGates/applyTokenGates';
import { verifyTokenGateMemberships } from 'lib/tokenGates/verifyTokenGateMemberships';
import { generateUserAndSpace } from 'testing/setupDatabase';
import { deleteTokenGate, generateTokenGate } from 'testing/utils/tokenGates';

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

const { user, space } = await generateUserAndSpace(undefined);
const { user: user2, space: space2 } = await generateUserAndSpace(undefined);

describe('verifyTokenGateMemberships', () => {
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
      tokenGateIds: [tokenGate.id],
      walletAddress: '0x123'
    });
    await deleteTokenGate(tokenGate.id);

    const tokenGate2 = await generateTokenGate({ userId: user2.id, spaceId: space2.id });

    await applyTokenGates({
      spaceId: space2.id,
      userId: user2.id,
      commit: true,
      tokenGateIds: [tokenGate2.id],
      walletAddress: '0x123'
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
      tokenGateIds: [tokenGate.id],
      walletAddress: '0x123'
    });
    await deleteTokenGate(tokenGate.id);

    const tokenGate2 = await generateTokenGate({ userId: user.id, spaceId: space2.id });

    await applyTokenGates({
      spaceId: space2.id,
      userId: user.id,
      commit: true,
      tokenGateIds: [tokenGate2.id],
      walletAddress: '0x123'
    });

    const res = await verifyTokenGateMemberships();

    const spaceUser1 = await getSpaceUser({ spaceId: space.id, userId: user.id });
    const spaceUser2 = await getSpaceUser({ spaceId: space2.id, userId: user.id });

    expect(res).toEqual({ removedRoles: 0, removedMembers: 1 });
    expect(spaceUser1).toBeNull();
    expect(spaceUser2).not.toBeNull();
  });
});
