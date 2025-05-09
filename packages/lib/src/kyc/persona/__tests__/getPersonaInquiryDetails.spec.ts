import { generateUserAndSpace } from '@packages/testing/setupDatabase';
import { generatePersonaCredential, generatePersonaUserKyc } from '@packages/testing/utils/kyc';
import { v4 } from 'uuid';

import { getPersonaInquiryDetails } from '../getPersonaInquiryDetails';

describe('getPersonaInquiryDetails', () => {
  it('should return null if no apikey or user inquiryId or user status', async () => {
    const spaceId = v4();
    const userId = v4();
    const data = await getPersonaInquiryDetails(spaceId, userId);

    expect(data).toBe(null);
  });

  it('should return inquiryId and status', async () => {
    const { space, user } = await generateUserAndSpace();
    await generatePersonaCredential({ spaceId: space.id });
    await generatePersonaUserKyc({ spaceId: space.id, userId: user.id, status: 'approved' });

    const data = await getPersonaInquiryDetails(space.id, user.id);

    expect(data?.inquiryId).toBeDefined();
    expect(data?.status).toBe('approved');
  });
});
