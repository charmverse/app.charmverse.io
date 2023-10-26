import type { Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import { applyTokenGates } from 'lib/token-gates/applyTokenGates';
import { verifyTokenGateMemberships } from 'lib/token-gates/verifyTokenGateMemberships';
import { generateUserAndSpace } from 'testing/setupDatabase';
import { verifiedJWTResponse } from 'testing/utils/litProtocol';
import { clearTokenGateData, deleteTokenGate, generateTokenGate } from 'testing/utils/tokenGates';

// @ts-ignore
let mockedLitJsSdk: jest.Mocked;

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

describe('verifyTokenGateMemberships', () => {
  let user: User;
  let user2: User;
  let space: Space;
  let space2: Space;

  beforeEach(async () => {
    // must be mocked here since we import using await import()
    jest.mock('@lit-protocol/lit-node-client');
    mockedLitJsSdk = await import('@lit-protocol/lit-node-client');
    await clearTokenGateData();
    const { user: u, space: s } = await generateUserAndSpace(undefined);
    const { user: u2, space: s2 } = await generateUserAndSpace(undefined);
    user = u;
    space = s;
    user2 = u2;
    space2 = s2;
  });

  afterEach(async () => {
    mockedLitJsSdk.verifyJwt.mockClear();
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

    mockedLitJsSdk.verifyJwt.mockReturnValue(
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
      tokens: [{ tokenGateId: tokenGate.id, signedToken: 'jwt1' }]
    });
    await deleteTokenGate(tokenGate.id);

    const tokenGate2 = await generateTokenGate({ userId: user2.id, spaceId: space2.id });

    mockedLitJsSdk.verifyJwt.mockReturnValue(
      verifiedJWTResponse({
        verified: true,
        payload: {
          orgId: space2.id,
          extraData: `{ "tokenGateId": "${tokenGate2.id}" }`
        }
      })
    );

    await applyTokenGates({
      spaceId: space2.id,
      userId: user2.id,
      commit: true,
      tokens: [{ tokenGateId: tokenGate2.id, signedToken: 'jwt2' }]
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

    mockedLitJsSdk.verifyJwt.mockReturnValue(
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
      tokens: [{ tokenGateId: tokenGate.id, signedToken: 'jwt1' }]
    });
    await deleteTokenGate(tokenGate.id);

    const tokenGate2 = await generateTokenGate({ userId: user.id, spaceId: space2.id });
    mockedLitJsSdk.verifyJwt.mockReturnValue(
      verifiedJWTResponse({
        verified: true,
        payload: {
          orgId: space2.id,
          extraData: `{ "tokenGateId": "${tokenGate2.id}" }`
        }
      })
    );

    await applyTokenGates({
      spaceId: space2.id,
      userId: user.id,
      commit: true,
      tokens: [{ tokenGateId: tokenGate2.id, signedToken: 'jwt2' }]
    });

    mockedLitJsSdk.verifyJwt.mockReturnValue(
      verifiedJWTResponse({
        verified: true,
        payload: {
          orgId: space2.id,
          extraData: `{ "tokenGateId": "${tokenGate2.id}" }`
        }
      })
    );

    const res = await verifyTokenGateMemberships();

    const spaceUser1 = await getSpaceUser({ spaceId: space.id, userId: user.id });
    const spaceUser2 = await getSpaceUser({ spaceId: space2.id, userId: user.id });

    expect(res).toEqual({ removedRoles: 0, removedMembers: 1 });
    expect(spaceUser1).toBeNull();
    expect(spaceUser2).not.toBeNull();
  });
});
