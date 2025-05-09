import { DataNotFoundError, UnauthorisedActionError } from '@charmverse/core/errors';
import { generateUserAndSpace } from '@packages/testing/setupDatabase';
import { generatePersonaCredential, generatePersonaUserKyc } from '@packages/testing/utils/kyc';
import { v4 } from 'uuid';

import { createPersonaInquiry } from '../createPersonaInquiry';

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

  it('should fail if there is an inquiry id that is pending', async () => {
    const { space, user } = await generateUserAndSpace();
    await generatePersonaCredential({ spaceId: space.id });
    await generatePersonaUserKyc({ spaceId: space.id, userId: user.id, status: 'approved' });

    await expect(createPersonaInquiry(space.id, user.id)).rejects.toThrow(UnauthorisedActionError);
  });

  it('should return a new inquiryId if the user had an old inquiry but did not finalise it', async () => {
    const { space, user } = await generateUserAndSpace();
    await generatePersonaCredential({ spaceId: space.id });
    await generatePersonaUserKyc({ spaceId: space.id, userId: user.id, status: 'created' });
    const createdInquiry = await createPersonaInquiry(space.id, user.id);

    expect(createdInquiry.inquiryId).toBeDefined();
    expect(createdInquiry.status).toBe('created');
  });

  it('should return a new inquiryId if the user does not have a inquiry in progress', async () => {
    const { space, user } = await generateUserAndSpace();
    await generatePersonaCredential({ spaceId: space.id });
    const createdInquiry = await createPersonaInquiry(space.id, user.id);

    expect(createdInquiry.inquiryId).toBeDefined();
    expect(createdInquiry.status).toBe('created');
  });
});
