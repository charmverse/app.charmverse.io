
import type { Role, Space } from '@prisma/client';

import { prisma } from 'db';
import type { LoggedInUser } from 'models';
import { generateRole, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

describe('verifyTokenGateMembership', () => {
  let user1: LoggedInUser;
  let space1: Space;
  let role: Role;
  let role2: Role;

  async function getSpaceUser () {
    return prisma.spaceRole.findUnique({
      where: {
        spaceUser: {
          spaceId: space1.id,
          userId: user1.id
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
    const { user, space } = await generateUserAndSpaceWithApiToken(undefined, true);
    role = await generateRole({ spaceId: space.id, roleName: 'test role 1', createdBy: user.id });
    role2 = await generateRole({ spaceId: space.id, roleName: 'test role 2', createdBy: user.id });

    user1 = user;
    space1 = space;
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
      spaceId: space1.id,
      userId: user1.id,
      canBeRemovedFromSpace: true,
      userSpaceRoles: verifyUser?.spaceRoleToRole
    });

    const user = await getSpaceUser();

    expect(res).toBe(true);
    expect(user).not.toBeNull();
  });

  it('should not verify and remove user token without tokenGateId', async () => {
    jest.mock('lit-js-sdk', () => ({
      verifyJwt: () => {
        return {
          verified: true,
          payload: {
            orgId: space1.id
          }
        };
      }
    }));

    const { verifyTokenGateMembership } = await import('lib/token-gates/verifyTokenGateMembership');

    const res = await verifyTokenGateMembership({
      userTokenGates: [{ jwt: 'testjwt1', tokenGateId: 'test1', id: 'testid1', grantedRoles: [] }],
      spaceId: space1.id,
      userId: user1.id
    });

    const user = await getSpaceUser();

    expect(res).toBe(false);
    expect(user).toBeNull();
  });

  it('should not verify and remove user with all token gates being not verified', async () => {
    jest.mock('lit-js-sdk', () => ({
      verifyJwt: () => {
        return {
          verified: false,
          payload: {
            orgId: space1.id
          }
        };
      }
    }));

    const { verifyTokenGateMembership } = await import('lib/token-gates/verifyTokenGateMembership');

    const res = await verifyTokenGateMembership({
      userTokenGates: [
        { jwt: 'testjwt1', tokenGateId: 'test1', id: 'testid1', grantedRoles: [], tokenGate: null },
        { jwt: 'testjwt2', tokenGateId: 'test2', id: 'testid2', grantedRoles: [], tokenGate: null },
        { jwt: 'testjwt3', tokenGateId: 'test3', id: 'testid3', grantedRoles: [], tokenGate: null }
      ],
      spaceId: space1.id,
      userId: user1.id
    });

    const user = await getSpaceUser();

    expect(res).toBe(false);
    expect(user).toBeNull();
  });

  it('should verify user with at least one valid token gate', async () => {
    jest.mock('lit-js-sdk', () => ({
      verifyJwt: ({ jwt }: { jwt: string }) => {
        return {
          verified: jwt === 'testjwt2',
          payload: {
            orgId: space1.id
          }
        };
      }
    }));

    const { verifyTokenGateMembership } = await import('lib/token-gates/verifyTokenGateMembership');

    const res = await verifyTokenGateMembership({
      userTokenGates: [
        { jwt: 'testjwt1', tokenGateId: 'test1', id: 'testid1', grantedRoles: [], tokenGate: {} as any },
        { jwt: 'testjwt2', tokenGateId: 'test2', id: 'testid2', grantedRoles: [], tokenGate: {} as any },
        { jwt: 'testjwt3', tokenGateId: 'test3', id: 'testid3', grantedRoles: [], tokenGate: {} as any }
      ],
      spaceId: space1.id,
      userId: user1.id
    });

    const user = await getSpaceUser();

    expect(res).toBe(true);
    expect(user).not.toBeNull();
  });
});
