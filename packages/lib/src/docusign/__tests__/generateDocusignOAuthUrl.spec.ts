import { InvalidInputError } from '@charmverse/core/errors';
import { baseUrl, docusignClientId, docusignOauthBaseUri } from '@packages/config/constants';
import { v4 as uuid } from 'uuid';

import { encodeDocusignState } from '../encodeAndDecodeDocusignState';
import { docusignScopes, generateDocusignOAuthUrl } from '../generateDocusignOAuthUrl';

jest.mock('../encodeAndDecodeDocusignState.ts', () => ({
  encodeDocusignState: jest.fn()
}));

describe('generateDocusignOAuthUrl', () => {
  const validUserId = uuid();
  const validSpaceId = uuid();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return a valid OAuth URL for valid input', async () => {
    const state = 'sealedState';
    (encodeDocusignState as jest.Mock).mockResolvedValue(state);

    const result = await generateDocusignOAuthUrl({ spaceId: validSpaceId, userId: validUserId });

    const expectedUrl = `${docusignOauthBaseUri}/oauth/auth?response_type=code&scope=${encodeURIComponent(
      docusignScopes.join(' ')
    )}&client_id=${docusignClientId}&redirect_uri=${encodeURIComponent(
      `${baseUrl}/api/docusign/callback`
    )}&state=${state}`;

    expect(result).toBe(expectedUrl);
    expect(encodeDocusignState).toHaveBeenCalledWith({ spaceId: validSpaceId, userId: validUserId });
  });

  it('should throw InvalidInputError for invalid userId', async () => {
    const invalidUserId = 'invalid-uuid';
    (encodeDocusignState as jest.Mock).mockRejectedValue(new InvalidInputError('Invalid spaceId or userId'));

    await expect(generateDocusignOAuthUrl({ spaceId: validSpaceId, userId: invalidUserId })).rejects.toThrow(
      InvalidInputError
    );
  });

  it('should throw InvalidInputError for invalid spaceId', async () => {
    const invalidSpaceId = 'invalid-uuid';
    (encodeDocusignState as jest.Mock).mockRejectedValue(new InvalidInputError('Invalid spaceId or userId'));

    await expect(generateDocusignOAuthUrl({ spaceId: invalidSpaceId, userId: validUserId })).rejects.toThrow(
      InvalidInputError
    );
  });

  it('should handle errors from encodeDocusignState', async () => {
    const error = new Error('encodeDocusignState error');
    (encodeDocusignState as jest.Mock).mockRejectedValue(error);

    await expect(generateDocusignOAuthUrl({ spaceId: validSpaceId, userId: validUserId })).rejects.toThrow(error);
  });
});
