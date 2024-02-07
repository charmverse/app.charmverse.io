import type { Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import { applyTokenGates } from 'lib/tokenGates/applyTokenGates';
import { verifyTokenGateMembership } from 'lib/tokenGates/verifyTokenGateMembership';
import type { UserToVerifyMembership } from 'lib/tokenGates/verifyTokenGateMemberships';
import { generateRole, generateUserAndSpace } from 'testing/setupDatabase';
import { verifiedJWTResponse } from 'testing/utils/litProtocol';
import {
  addRoleToTokenGate,
  deleteTokenGate,
  generateHypersubTokenGate,
  generateTokenGate,
  generateUnlockTokenGate
} from 'testing/utils/tokenGates';

import { getPublicClient } from '../../blockchain/publicClient';

// @ts-ignore
let mockedLitSDK: jest.Mocked;

jest.mock('../../blockchain/publicClient');
const mockGetPublicClient = jest.mocked(getPublicClient);

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
    jest.mock('@lit-protocol/lit-node-client');
    mockedLitSDK = await import('@lit-protocol/lit-node-client');
    mockGetPublicClient.mockClear();

    const { user: u, space: s } = await generateUserAndSpace(undefined);
    user = u;
    space = s;
  });

  afterEach(async () => {
    mockedLitSDK.verifyJwt.mockClear();
    jest.resetModules();
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

    expect(res).toEqual({ removedRoles: 0, verified: true });
    expect(spaceUser).not.toBeNull();
  });

  it('should not verify and remove user connected via deleted token gate', async () => {
    const tokenGate = await generateTokenGate({ userId: user.id, spaceId: space.id });

    mockedLitSDK.verifyJwt.mockReturnValue(
      verifiedJWTResponse({
        verified: true,
        payload: {
          orgId: space.id,
          extraData: `{ "tokenGateId": "${tokenGate.id}" }`
        }
      })
    );

    await applyTokenGates({
      spaceId: space.id,
      userId: user.id,
      commit: true,
      tokens: [{ tokenGateId: tokenGate.id, signedToken: 'jwt1' }],
      walletAddress: '0x123'
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
    const tokenGate3 = await generateUnlockTokenGate({ userId: user.id, spaceId: space.id });
    const tokenGate4 = await generateHypersubTokenGate({ userId: user.id, spaceId: space.id });

    mockedLitSDK.verifyJwt
      // verify to apply token gate
      .mockReturnValueOnce(
        verifiedJWTResponse({
          verified: true,
          payload: {
            orgId: space.id,
            extraData: `{ "tokenGateId": "${tokenGate1.id}" }`
          }
        })
      )
      // verify to apply token gate
      .mockReturnValueOnce(
        verifiedJWTResponse({
          verified: true,
          payload: {
            orgId: space.id,
            extraData: `{ "tokenGateId": "${tokenGate2.id}" }`
          }
        })
      );

    mockGetPublicClient.mockReturnValueOnce({
      readContract: jest.fn().mockReturnValueOnce('My New Lock').mockReturnValueOnce(true)
    } as any);

    mockGetPublicClient.mockReturnValueOnce({
      readContract: jest.fn().mockReturnValueOnce('My New Hypersub').mockReturnValueOnce(true)
    } as any);

    await applyTokenGates({
      spaceId: space.id,
      userId: user.id,
      commit: true,
      tokens: [
        { tokenGateId: tokenGate1.id, signedToken: 'jwt1' },
        { tokenGateId: tokenGate2.id, signedToken: 'jwt2' },
        { tokenGateId: tokenGate3.id, signedToken: '' },
        { tokenGateId: tokenGate4.id, signedToken: '' }
      ],
      walletAddress: '0x1bd0d6edb387114b2fdf20d683366fa9f94a07f4'
    });

    const verifyUser = (await getSpaceUser()) as UserToVerifyMembership;

    // do not verify token gates anymore
    mockedLitSDK.verifyJwt.mockReturnValue(verifiedJWTResponse({ verified: false }));

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

    mockedLitSDK.verifyJwt
      // verify to apply token gate
      .mockReturnValueOnce(
        verifiedJWTResponse({
          verified: true,
          payload: {
            orgId: space.id,
            extraData: `{ "tokenGateId": "${tokenGate1.id}" }`
          }
        })
      )
      // verify to apply token gate
      .mockReturnValueOnce(
        verifiedJWTResponse({
          verified: true,
          payload: {
            orgId: space.id,
            extraData: `{ "tokenGateId": "${tokenGate2.id}" }`
          }
        })
      );

    await applyTokenGates({
      spaceId: space.id,
      userId: user.id,
      commit: true,
      tokens: [
        { tokenGateId: tokenGate1.id, signedToken: 'jwt1' },
        { tokenGateId: tokenGate2.id, signedToken: 'jwt2' }
      ],
      walletAddress: '0x123'
    });

    const verifyUser = (await getSpaceUser()) as UserToVerifyMembership;

    mockedLitSDK.verifyJwt.mockImplementation(({ jwt }: { jwt: string }) => {
      // verify only one of token gates
      if (jwt === 'jwt1') {
        return verifiedJWTResponse({
          verified: true,
          payload: {
            orgId: space.id
          }
        });
      }

      return verifiedJWTResponse({ verified: false });
    });

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

    mockedLitSDK.verifyJwt
      // verify to apply token gate
      .mockReturnValueOnce(
        verifiedJWTResponse({
          verified: true,
          payload: {
            orgId: space.id,
            extraData: `{ "tokenGateId": "${tokenGate1.id}" }`
          }
        })
      )
      // verify to apply token gate
      .mockReturnValueOnce(
        verifiedJWTResponse({
          verified: true,
          payload: {
            orgId: space.id,
            extraData: `{ "tokenGateId": "${tokenGate2.id}" }`
          }
        })
      );

    await applyTokenGates({
      spaceId: space.id,
      userId: user.id,
      commit: true,
      tokens: [
        { tokenGateId: tokenGate1.id, signedToken: 'jwt1' },
        { tokenGateId: tokenGate2.id, signedToken: 'jwt2' }
      ],
      walletAddress: '0x123'
    });

    const verifyUser = (await getSpaceUser()) as UserToVerifyMembership;

    mockedLitSDK.verifyJwt.mockReturnValue(verifiedJWTResponse({ verified: false }));

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

    mockedLitSDK.verifyJwt
      // verify to apply token gate
      .mockReturnValueOnce(
        verifiedJWTResponse({
          verified: true,
          payload: {
            orgId: space.id,
            extraData: `{ "tokenGateId": "${tokenGate1.id}" }`
          }
        })
      )
      // verify to apply token gate
      .mockReturnValueOnce(
        verifiedJWTResponse({
          verified: true,
          payload: {
            orgId: space.id,
            extraData: `{ "tokenGateId": "${tokenGate2.id}" }`
          }
        })
      );

    await applyTokenGates({
      spaceId: space.id,
      userId: user.id,
      commit: true,
      tokens: [
        { tokenGateId: tokenGate1.id, signedToken: 'jwt1' },
        { tokenGateId: tokenGate2.id, signedToken: 'jwt2' }
      ],
      walletAddress: '0x123'
    });
    await deleteTokenGate(tokenGate1.id);

    const verifyUser = (await getSpaceUser()) as UserToVerifyMembership;

    mockedLitSDK.verifyJwt.mockReturnValueOnce(
      verifiedJWTResponse({
        verified: true,
        payload: {
          orgId: space.id,
          extraData: `{ "tokenGateId": "${tokenGate2.id}" }`
        }
      })
    );

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

    mockedLitSDK.verifyJwt
      // verify to apply token gate
      .mockReturnValueOnce(
        verifiedJWTResponse({
          verified: true,
          payload: {
            orgId: space.id,
            extraData: `{ "tokenGateId": "${tokenGate1.id}" }`
          }
        })
      )
      // verify to apply token gate
      .mockReturnValueOnce(
        verifiedJWTResponse({
          verified: true,
          payload: {
            orgId: space.id,
            extraData: `{ "tokenGateId": "${tokenGate2.id}" }`
          }
        })
      );

    await applyTokenGates({
      spaceId: space.id,
      userId: user.id,
      commit: true,
      tokens: [
        { tokenGateId: tokenGate1.id, signedToken: 'jwt1' },
        { tokenGateId: tokenGate2.id, signedToken: 'jwt2' }
      ],
      walletAddress: '0x123'
    });

    const verifyUser = (await getSpaceUser()) as UserToVerifyMembership;

    mockedLitSDK.verifyJwt.mockImplementation(({ jwt }: { jwt: string }) => {
      // verify only one of token gates
      if (jwt === 'jwt2') {
        return verifiedJWTResponse({
          verified: true,
          payload: {
            orgId: space.id
          }
        });
      }

      return verifiedJWTResponse({ verified: false });
    });

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
