import { DataNotFoundError, UnauthorisedActionError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { v4 } from 'uuid';

import { generateUserAndSpace } from 'testing/setupDatabase';
import { generateSynapsCredential, generateSynapsUserKyc } from 'testing/utils/kyc';

import { createSynapsSession } from '../createSynapsSession';

jest.mock('../initSynapsSession', () => ({
  initSynapsSession: async (userId: string, apiKey: string) => ({
    session_id: v4()
  })
}));

describe('createSynapsSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fail if no api key is found', async () => {
    const spaceId = v4();
    const userId = v4();

    await expect(createSynapsSession(spaceId, userId)).rejects.toThrow(DataNotFoundError);
  });

  it('should fail if there is a session id that is pending', async () => {
    const { space, user } = await generateUserAndSpace();
    await generateSynapsCredential({ spaceId: space.id });
    await generateSynapsUserKyc({ spaceId: space.id, userId: user.id });

    await expect(createSynapsSession(space.id, user.id)).rejects.toThrow(UnauthorisedActionError);
  });

  it("should return the session_id if the user has an active session and he didn't finish it", async () => {
    const { space, user } = await generateUserAndSpace();
    await generateSynapsCredential({ spaceId: space.id });
    await generateSynapsUserKyc({ spaceId: space.id, userId: user.id, status: 'RESUBMISSION_REQUIRED' });
    const createdSession = await createSynapsSession(space.id, user.id);

    expect(createdSession.session_id).toBeDefined();
  });

  it('should return a new session_id if the user does not have a session in progress', async () => {
    const { space, user } = await generateUserAndSpace();
    await generateSynapsCredential({ spaceId: space.id });
    const createdSession = await createSynapsSession(space.id, user.id);

    expect(createdSession.session_id).toBeDefined();
  });
});
