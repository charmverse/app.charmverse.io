
import type { Role, Space } from '@prisma/client';

import { prisma } from 'db';
import type { UserToVerifyMembership } from 'lib/token-gates/verifyTokenGateMemberships';
import type { LoggedInUser } from 'models';
import { generateRole, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { deleteTokenGate, generateTokenGate } from 'testing/utils/tokenGates';

describe('verifyTokenGateMembership', () => {
  let user: LoggedInUser;
  let space: Space;
  let role: Role;
  let role2: Role;

  async function getSpaceUser () {
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
    const { user: u, space: s } = await generateUserAndSpaceWithApiToken(undefined, true);
    user = u;
    space = s;

    role = await generateRole({ spaceId: space.id, roleName: 'test role 1', createdBy: user.id });
    role2 = await generateRole({ spaceId: space.id, roleName: 'test role 2', createdBy: user.id });
  });

  afterEach(() => {
    jest.unmock('lit-js-sdk');
    jest.resetModules();
  });

  it('should return true if user does not have any token gate connected', async () => {
    const { verifyTokenGateMembership } = await import('lib/token-gates/verifyTokenGateMembership');
    const verifyUser = await getSpaceUser();
    const res = await verifyTokenGateMembership({
      userTokenGates: [],
      spaceId: space.id,
      userId: user.id,
      canBeRemovedFromSpace: true,
      userSpaceRoles: verifyUser?.spaceRoleToRole
    });

    const spaceUser = await getSpaceUser();

    expect(res).toBe(true);
    expect(spaceUser).not.toBeNull();
  });

  it('should not verify and remove user connected via deleted token gate', async () => {
    const tokenGate = await generateTokenGate({ userId: user.id, spaceId: space.id });

    const verifyJwtMock = jest.fn()
      .mockResolvedValue({
        verified: true,
        payload: {
          orgId: space.id,
          extraData: `{ "tokenGateId": "${tokenGate.id}" }`
        }
      });

    jest.mock('lit-js-sdk', () => ({
      verifyJwt: verifyJwtMock
    }));

    const { verifyTokenGateMembership } = await import('lib/token-gates/verifyTokenGateMembership');
    const { applyTokenGates } = await import('lib/token-gates/applyTokenGates');

    await applyTokenGates({ spaceId: space.id, userId: user.id, commit: true, tokens: [{ tokenGateId: tokenGate.id, signedToken: 'jwt1' }] });
    await deleteTokenGate(tokenGate.id);

    const verifyUser = await getSpaceUser() as UserToVerifyMembership;

    const res = await verifyTokenGateMembership({
      userTokenGates: verifyUser.user.userTokenGates,
      spaceId: space.id,
      userId: user.id,
      canBeRemovedFromSpace: true
    });

    const spaceUser = await getSpaceUser();
    expect(verifyUser.user.userTokenGates.length).toBe(1);
    expect(verifyUser.user.userTokenGates[0].tokenGate).toBeNull();
    expect(res).toBe(false);
    expect(spaceUser).toBeNull();
  });

  it('should not verify and remove user with all token gates being not verified', async () => {
    const tokenGate1 = await generateTokenGate({ userId: user.id, spaceId: space.id });
    const tokenGate2 = await generateTokenGate({ userId: user.id, spaceId: space.id });

    const verifyJwtMock = jest.fn()
      // verify to apply token gate
      .mockResolvedValueOnce({
        verified: true,
        payload: {
          orgId: space.id,
          extraData: `{ "tokenGateId": "${tokenGate1.id}" }`
        }
      })
      // verify to apply token gate
      .mockResolvedValueOnce({
        verified: true,
        payload: {
          orgId: space.id,
          extraData: `{ "tokenGateId": "${tokenGate2.id}" }`
        }
      });

    jest.mock('lit-js-sdk', () => ({
      verifyJwt: verifyJwtMock
    }));

    const { verifyTokenGateMembership } = await import('lib/token-gates/verifyTokenGateMembership');
    const { applyTokenGates } = await import('lib/token-gates/applyTokenGates');

    await applyTokenGates({ spaceId: space.id,
      userId: user.id,
      commit: true,
      tokens: [
        { tokenGateId: tokenGate1.id, signedToken: 'jwt1' },
        { tokenGateId: tokenGate2.id, signedToken: 'jwt2' }
      ]
    });

    const verifyUser = await getSpaceUser() as UserToVerifyMembership;

    // do not verify token gates anymore
    verifyJwtMock.mockResolvedValue({ verified: false });

    const res = await verifyTokenGateMembership({
      userTokenGates: verifyUser.user.userTokenGates,
      spaceId: space.id,
      userId: user.id,
      canBeRemovedFromSpace: true
    });

    const spaceUser = await getSpaceUser();
    expect(verifyUser.user.userTokenGates.length).toBe(2);
    expect(res).toBe(false);
    expect(spaceUser).toBeNull();
  });

  it('should verify user with at least one valid token gate', async () => {
    const tokenGate1 = await generateTokenGate({ userId: user.id, spaceId: space.id });
    const tokenGate2 = await generateTokenGate({ userId: user.id, spaceId: space.id });

    const verifyJwtMock = jest.fn()
      // verify to apply token gate
      .mockResolvedValueOnce({
        verified: true,
        payload: {
          orgId: space.id,
          extraData: `{ "tokenGateId": "${tokenGate1.id}" }`
        }
      })
      // verify to apply token gate
      .mockResolvedValueOnce({
        verified: true,
        payload: {
          orgId: space.id,
          extraData: `{ "tokenGateId": "${tokenGate2.id}" }`
        }
      });

    jest.mock('lit-js-sdk', () => ({
      verifyJwt: verifyJwtMock
    }));

    const { verifyTokenGateMembership } = await import('lib/token-gates/verifyTokenGateMembership');
    const { applyTokenGates } = await import('lib/token-gates/applyTokenGates');

    await applyTokenGates({ spaceId: space.id,
      userId: user.id,
      commit: true,
      tokens: [
        { tokenGateId: tokenGate1.id, signedToken: 'jwt1' },
        { tokenGateId: tokenGate2.id, signedToken: 'jwt2' }
      ]
    });

    const verifyUser = await getSpaceUser() as UserToVerifyMembership;

    verifyJwtMock.mockImplementation(({ jwt }) => {
      // verify only one of token gates
      if (jwt === 'jwt1') {
        return {
          verified: true,
          payload: {
            orgId: space.id
          }
        };
      }

      return { verified: true };
    });

    const res = await verifyTokenGateMembership({
      userTokenGates: verifyUser.user.userTokenGates,
      spaceId: space.id,
      userId: user.id,
      canBeRemovedFromSpace: true
    });

    const spaceUser = await getSpaceUser();
    expect(verifyUser.user.userTokenGates.length).toBe(2);
    expect(res).toBe(true);
    expect(spaceUser).not.toBeNull();
  });
});
