import { generateUserAndSpace } from '@packages/testing/setupDatabase';
import { generatePersonaCredential, generateSynapsCredential } from '@packages/testing/utils/kyc';
import { v4 } from 'uuid';

import { getKycCredentials } from '../getKycCredentials';

describe('getKycCredentials', () => {
  it('should return null if no apikey or user inquiryId or user status', async () => {
    const spaceId = v4();
    const data = await getKycCredentials(spaceId);

    expect(data?.synaps).toBe(null);
    expect(data?.persona).toBe(null);
  });

  it('should return inquiryId and status', async () => {
    const { space, user } = await generateUserAndSpace();
    await generatePersonaCredential({ spaceId: space.id });
    await generateSynapsCredential({ spaceId: space.id });

    const data = await getKycCredentials(space.id);

    expect(data?.synaps).toBeDefined();
    expect(data?.persona).toBeDefined();
  });
});
