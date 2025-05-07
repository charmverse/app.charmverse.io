import { generateUserAndSpace } from '@packages/testing/setupDatabase';
import { generateSynapsCredential, generateSynapsUserKyc } from '@packages/testing/utils/kyc';
import { v4 } from 'uuid';

import { getSynapsSessionDetails } from '../getSynapsSessionDetails';

describe('getSynapsSessionDetails', () => {
  it('should return null if no apikey or user inquiryId or user status', async () => {
    const spaceId = v4();
    const userId = v4();
    const data = await getSynapsSessionDetails(spaceId, userId);

    expect(data).toBe(null);
  });

  it('should return inquiryId and status', async () => {
    const { space, user } = await generateUserAndSpace();
    await generateSynapsCredential({ spaceId: space.id });
    await generateSynapsUserKyc({ spaceId: space.id, userId: user.id, status: 'APPROVED' });

    const data = await getSynapsSessionDetails(space.id, user.id);

    expect(data?.id).toBeDefined();
    expect(data?.status).toBe('APPROVED');
  });
});
