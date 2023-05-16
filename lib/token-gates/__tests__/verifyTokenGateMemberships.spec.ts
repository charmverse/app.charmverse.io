import { prisma } from '@charmverse/core';
import type { Space } from '@charmverse/core/prisma';
import * as litSDK from 'lit-js-sdk';

import { applyTokenGates } from 'lib/token-gates/applyTokenGates';
import { verifyTokenGateMemberships } from 'lib/token-gates/verifyTokenGateMemberships';
import type { LoggedInUser } from 'models';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { verifiedJWTResponse } from 'testing/utils/litProtocol';
import { clearTokenGateData, deleteTokenGate, generateTokenGate } from 'testing/utils/tokenGates';

jest.mock('lit-js-sdk');

// @ts-ignore
const mockedLitSDK: jest.Mocked<typeof litSDK> = litSDK;

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
  let user: LoggedInUser;
  let user2: LoggedInUser;
  let space: Space;
  let space2: Space;

  beforeEach(async () => {
    await clearTokenGateData();
    const { user: u, space: s } = await generateUserAndSpaceWithApiToken(undefined, false);
    const { user: u2, space: s2 } = await generateUserAndSpaceWithApiToken(undefined, false);
    user = u;
    space = s;
    user2 = u2;
    space2 = s2;
  });

  afterEach(async () => {
    mockedLitSDK.verifyJwt.mockClear();
    // jest.unmock('lit-js-sdk');
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

    mockedLitSDK.verifyJwt.mockResolvedValue(
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
    mockedLitSDK.verifyJwt.mockResolvedValue(
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

    mockedLitSDK.verifyJwt.mockResolvedValue(
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
    mockedLitSDK.verifyJwt.mockResolvedValue(
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

    mockedLitSDK.verifyJwt.mockResolvedValue(
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
