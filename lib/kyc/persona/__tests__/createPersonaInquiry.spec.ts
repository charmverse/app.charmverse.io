import { DataNotFoundError, UnauthorisedActionError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { v4 } from 'uuid';

import { generateUserAndSpace } from 'testing/setupDatabase';
import {
  generateSynapsCredential,
  generatePersonaCredential,
  generateSynapsUserKyc,
  generatePersonaUserKyc
} from 'testing/utils/kyc';

import { createPersonaInquiry } from '../createPersonaInquiry';
import { initPersonaInquiry } from '../initPersonaInquiry';

jest.mock('../initPersonaInquiry', () => ({
  initPersonaInquiry: async (userId: string, apiKey: string, templateId: string) => ({
    data: {
      id: v4(),
      attributes: {
        status: 'created'
      }
    }
  })
}));

describe('createPersonaInquiry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fail if no api key is found', async () => {
    const spaceId = v4();
    const userId = v4();

    await expect(createPersonaInquiry(spaceId, userId)).rejects.toThrow(DataNotFoundError);
  });

  it('should fail if there is a session id that is pending', async () => {
    const { space, user } = await generateUserAndSpace();
    await generatePersonaCredential({ spaceId: space.id });
    await generatePersonaUserKyc({ spaceId: space.id, userId: user.id, status: 'approved' });

    await expect(createPersonaInquiry(space.id, user.id)).rejects.toThrow(UnauthorisedActionError);
  });

  it('should return a new session_id if the user had an old session but did not finalise it', async () => {
    const { space, user } = await generateUserAndSpace();
    await generatePersonaCredential({ spaceId: space.id });
    await generatePersonaUserKyc({ spaceId: space.id, userId: user.id, status: 'created' });
    const createdSession = await createPersonaInquiry(space.id, user.id);

    expect(createdSession.inquiryId).toBeDefined();
    expect(createdSession.status).toBe('created');
  });

  it('should return a new session_id if the user does not have a session in progress', async () => {
    const { space, user } = await generateUserAndSpace();
    await generatePersonaCredential({ spaceId: space.id });
    const createdSession = await createPersonaInquiry(space.id, user.id);

    expect(createdSession.inquiryId).toBeDefined();
    expect(createdSession.status).toBe('created');
  });
});
