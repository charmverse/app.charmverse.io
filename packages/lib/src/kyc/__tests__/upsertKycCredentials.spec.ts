import { InvalidInputError } from '@charmverse/core/errors';
import { generateUserAndSpace } from '@packages/testing/setupDatabase';
import { v4 } from 'uuid';

import { upsertKycCredentials } from '../upsertKycCredentials';

describe('upsertKycCredentials', () => {
  it('should throw an error if synaps and persona have no payload', async () => {
    const spaceId = v4();

    await expect(upsertKycCredentials({ spaceId, synaps: null, persona: null })).rejects.toThrow(InvalidInputError);
  });

  it('should return apiKey and the other data if payload has at least one credential', async () => {
    const { space } = await generateUserAndSpace();

    const data = await upsertKycCredentials({
      spaceId: space.id,
      synaps: null,
      persona: {
        apiKey: v4(),
        secret: v4(),
        templateId: v4(),
        spaceId: space.id
      }
    });

    expect(data.persona?.apiKey).toBeDefined();
  });
});
