import type { Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { generateRole, generateUserAndSpace } from '@packages/testing/setupDatabase';
import { addRoleToTokenGate, deleteTokenGate, generateTokenGate } from '@packages/testing/utils/tokenGates';
import { applyTokenGates } from '@packages/lib/tokenGates/applyTokenGates';
import { validateTokenGateConditionWithDelegates } from '@packages/lib/tokenGates/validateTokenGateConditionWithDelegates';
import { verifyTokenGateMembership } from '@packages/lib/tokenGates/verifyTokenGateMembership';
import type { UserToVerifyMembership } from '@packages/lib/tokenGates/verifyTokenGateMemberships';
import { walletAddress } from 'stories/lib/mockTokenGataData';

import { getPublicClient } from '../../blockchain/publicClient';

jest.mock('../../blockchain/publicClient');
const mockGetPublicClient = jest.mocked(getPublicClient);

jest.mock('lib/tokenGates/validateTokenGateConditionWithDelegates');
const mockValidateTokenGateCondition = jest.mocked(validateTokenGateConditionWithDelegates);

describe('verifyTokenGateMembership', () => {
  let user: User;
  let space: Space;

  async function getSpaceUser() {
    return prisma.spaceRole.findUnique({
      where: {
        spaceUser: {
          spaceId: space.id,
          userId: user.id
        }
      },
      include: {
        user: {
          include: {
            userTokenGates: {
              include: {
                tokenGate: {
                  include: {
                    tokenGateToRoles: {
                      include: {
                        role: true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        spaceRoleToRole: {
          include: {
            role: true
          }
        }
      }
    });
  }

  beforeEach(async () => {
    mockGetPublicClient.mockClear();
    mockValidateTokenGateCondition.mockClear();

    const { user: u, space: s } = await generateUserAndSpace({ walletAddress });
    user = u;
    space = s;
  });

  afterEach(async () => {
    jest.resetModules();

    await prisma.user.delete({
      where: {
        id: user.id
      }
    });
  });

  it('should return true if user does not have any token gate connected', async () => {
    const verifyUser = await getSpaceUser();
    const res = await verifyTokenGateMembership({
      userTokenGates: [],
      spaceId: space.id,
      userId: user.id,
      canBeRemovedFromSpace: true,
      userSpaceRoles: verifyUser?.spaceRoleToRole
    });

    const spaceUser = await getSpaceUser();

    mockValidateTokenGateCondition.mockReturnValue(Promise.resolve(true));

    expect(res).toEqual({ removedRoles: 0, verified: true });
    expect(spaceUser).not.toBeNull();
  });

  it('should not verify and remove user connected via deleted token gate', async () => {
    const tokenGate = await generateTokenGate({ userId: user.id, spaceId: space.id });

    mockValidateTokenGateCondition.mockReturnValue(Promise.resolve(true));

    await applyTokenGates({
      spaceId: space.id,
      userId: user.id,
      commit: true,
      tokenGateIds: [tokenGate.id]
    });
    await deleteTokenGate(tokenGate.id);

    const verifyUser = (await getSpaceUser()) as UserToVerifyMembership;

    const res = await verifyTokenGateMembership({
      userTokenGates: verifyUser.user.userTokenGates,
      spaceId: space.id,
      userId: user.id,
      canBeRemovedFromSpace: true
    });

    const spaceUser = await getSpaceUser();
    expect(verifyUser.user.userTokenGates.length).toBe(1);
    expect(verifyUser.user.userTokenGates[0].tokenGate).toBeNull();
    expect(res).toEqual({ removedRoles: 0, verified: false });
    expect(spaceUser).toBeNull();
  });

  it('should not verify and remove user with all token gates being not verified', async () => {
    const tokenGate1 = await generateTokenGate({ userId: user.id, spaceId: space.id });
    const tokenGate2 = await generateTokenGate({ userId: user.id, spaceId: space.id });
    const tokenGate3 = await generateTokenGate({
      userId: user.id,
      spaceId: space.id,
      extraDetails: { type: 'Unlock' }
    });
    const tokenGate4 = await generateTokenGate({
      userId: user.id,
      spaceId: space.id,
      extraDetails: { type: 'Hypersub' }
    });

    mockValidateTokenGateCondition.mockReturnValue(Promise.resolve(true));

    await applyTokenGates({
      spaceId: space.id,
      userId: user.id,
      commit: true,
      tokenGateIds: [tokenGate1.id, tokenGate2.id, tokenGate3.id, tokenGate4.id]
    });

    const verifyUser = (await getSpaceUser()) as UserToVerifyMembership;

    // do not verify token gates anymore
    mockValidateTokenGateCondition.mockReturnValue(Promise.resolve(false));

    const res = await verifyTokenGateMembership({
      userTokenGates: verifyUser.user.userTokenGates,
      spaceId: space.id,
      userId: user.id,
      canBeRemovedFromSpace: true
    });

    const spaceUser = await getSpaceUser();
    expect(verifyUser.user.userTokenGates.length).toBe(4);
    expect(res).toEqual({ removedRoles: 0, verified: false });
    expect(spaceUser).toBeNull();
  });

  it('should verify user with at least one valid token gate', async () => {
    const tokenGate1 = await generateTokenGate({ userId: user.id, spaceId: space.id });
    const tokenGate2 = await generateTokenGate({ userId: user.id, spaceId: space.id });
    mockValidateTokenGateCondition.mockReturnValue(Promise.resolve(true));

    await applyTokenGates({
      spaceId: space.id,
      userId: user.id,
      commit: true,
      tokenGateIds: [tokenGate1.id, tokenGate2.id]
    });

    const verifyUser = (await getSpaceUser()) as UserToVerifyMembership;

    const res = await verifyTokenGateMembership({
      userTokenGates: verifyUser.user.userTokenGates,
      spaceId: space.id,
      userId: user.id,
      canBeRemovedFromSpace: true
    });

    const spaceUser = await getSpaceUser();
    expect(verifyUser.user.userTokenGates.length).toBe(2);
    expect(res).toEqual({ removedRoles: 0, verified: true });
    expect(spaceUser).not.toBeNull();
  });

  it('should remove all roles assigned via token gates', async () => {
    const tokenGate1 = await generateTokenGate({ userId: user.id, spaceId: space.id });
    const tokenGate2 = await generateTokenGate({ userId: user.id, spaceId: space.id });

    const role = await generateRole({ spaceId: space.id, roleName: 'test role 1', createdBy: user.id });
    const role2 = await generateRole({ spaceId: space.id, roleName: 'test role 2', createdBy: user.id });

    await addRoleToTokenGate({ tokenGateId: tokenGate1.id, roleId: role.id });
    await addRoleToTokenGate({ tokenGateId: tokenGate2.id, roleId: role2.id });

    mockValidateTokenGateCondition.mockReturnValue(Promise.resolve(true));

    await applyTokenGates({
      spaceId: space.id,
      userId: user.id,
      commit: true,
      tokenGateIds: [tokenGate1.id, tokenGate2.id]
    });

    const verifyUser = (await getSpaceUser()) as UserToVerifyMembership;

    mockValidateTokenGateCondition.mockReturnValue(Promise.resolve(false));

    const res = await verifyTokenGateMembership({
      userTokenGates: verifyUser.user.userTokenGates,
      spaceId: space.id,
      userId: user.id,
      canBeRemovedFromSpace: false,
      userSpaceRoles: verifyUser.spaceRoleToRole
    });

    const spaceUser = await getSpaceUser();
    expect(verifyUser.user.userTokenGates.length).toBe(2);
    expect(verifyUser.spaceRoleToRole.length).toBe(2);
    expect(res).toEqual({ removedRoles: 2, verified: true });
    expect(spaceUser).not.toBeNull();
    expect(spaceUser?.spaceRoleToRole.length).toBe(0);
  });

  it('should remove roles assigned via deleted token gate', async () => {
    const tokenGate1 = await generateTokenGate({ userId: user.id, spaceId: space.id });
    const tokenGate2 = await generateTokenGate({ userId: user.id, spaceId: space.id });

    const role = await generateRole({ spaceId: space.id, roleName: 'test role 1', createdBy: user.id });
    const role2 = await generateRole({ spaceId: space.id, roleName: 'test role 2', createdBy: user.id });

    await addRoleToTokenGate({ tokenGateId: tokenGate1.id, roleId: role.id });
    await addRoleToTokenGate({ tokenGateId: tokenGate2.id, roleId: role2.id });

    mockValidateTokenGateCondition.mockReturnValue(Promise.resolve(true));

    await applyTokenGates({
      spaceId: space.id,
      userId: user.id,
      commit: true,
      tokenGateIds: [tokenGate1.id, tokenGate2.id]
    });
    await deleteTokenGate(tokenGate1.id);

    const verifyUser = (await getSpaceUser()) as UserToVerifyMembership;

    const res = await verifyTokenGateMembership({
      userTokenGates: verifyUser.user.userTokenGates,
      spaceId: space.id,
      userId: user.id,
      canBeRemovedFromSpace: false,
      userSpaceRoles: verifyUser.spaceRoleToRole
    });

    const spaceUser = await getSpaceUser();
    expect(verifyUser.user.userTokenGates.length).toBe(2);
    expect(verifyUser.spaceRoleToRole.length).toBe(2);
    expect(res).toEqual({ removedRoles: 1, verified: true });
    expect(spaceUser).not.toBeNull();
    expect(spaceUser?.spaceRoleToRole.length).toBe(1);
    expect(spaceUser?.spaceRoleToRole[0].roleId).toBe(role2.id);
  });

  it('should not remove role assigned via at least one valid token gate', async () => {
    const tokenGate1 = await generateTokenGate({ userId: user.id, spaceId: space.id });
    const tokenGate2 = await generateTokenGate({ userId: user.id, spaceId: space.id });

    const role = await generateRole({ spaceId: space.id, roleName: 'test role 1', createdBy: user.id });
    const role2 = await generateRole({ spaceId: space.id, roleName: 'test role 2', createdBy: user.id });
    const role3 = await generateRole({ spaceId: space.id, roleName: 'test role 3', createdBy: user.id });

    await addRoleToTokenGate({ tokenGateId: tokenGate1.id, roleId: role.id });
    await addRoleToTokenGate({ tokenGateId: tokenGate1.id, roleId: role2.id });
    await addRoleToTokenGate({ tokenGateId: tokenGate2.id, roleId: role2.id });
    await addRoleToTokenGate({ tokenGateId: tokenGate2.id, roleId: role3.id });

    mockValidateTokenGateCondition.mockReturnValue(Promise.resolve(true));

    await applyTokenGates({
      spaceId: space.id,
      userId: user.id,
      commit: true,
      tokenGateIds: [tokenGate1.id, tokenGate2.id]
    });
    await deleteTokenGate(tokenGate1.id);

    const verifyUser = (await getSpaceUser()) as UserToVerifyMembership;

    mockValidateTokenGateCondition.mockReturnValueOnce(Promise.resolve(true));

    const res = await verifyTokenGateMembership({
      userTokenGates: verifyUser.user.userTokenGates,
      spaceId: space.id,
      userId: user.id,
      canBeRemovedFromSpace: false,
      userSpaceRoles: verifyUser.spaceRoleToRole
    });

    const spaceUser = await getSpaceUser();
    expect(verifyUser.user.userTokenGates.length).toBe(2);
    expect(verifyUser.spaceRoleToRole.length).toBe(3);
    expect(res).toEqual({ removedRoles: 1, verified: true });
    expect(spaceUser).not.toBeNull();
    expect(spaceUser?.spaceRoleToRole.length).toBe(2);
    expect(spaceUser?.spaceRoleToRole).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ roleId: role2.id }),
        expect.objectContaining({ roleId: role3.id })
      ])
    );
    expect(spaceUser?.spaceRoleToRole).toEqual(
      expect.not.arrayContaining([expect.objectContaining({ roleId: role.id })])
    );
  });
});
