import { InvalidInputError } from '@packages/core/errors';
import { stringUtils } from '@packages/core/utilities';
import { authSecret } from '@packages/utils/constants';
import { sealData, unsealData } from 'iron-session';
import { v4 as uuid } from 'uuid';

import { encodeDocusignState, decodeDocusignState } from '../encodeAndDecodeDocusignState';

jest.mock('iron-session', () => ({
  sealData: jest.fn(),
  unsealData: jest.fn()
}));

describe('Docusign OAuth State Functions', () => {
  const validUserId = uuid();
  const validSpaceId = uuid();
  const invalidUUID = 'invalid-uuid';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('encodeDocusignState', () => {
    it('should return a sealed string for valid input', async () => {
      const input = { userId: validUserId, spaceId: validSpaceId };
      const sealedString = 'sealedString';
      (sealData as jest.Mock).mockResolvedValue(sealedString);

      const result = await encodeDocusignState(input);

      expect(result).toBe(sealedString);
      expect(sealData).toHaveBeenCalledWith(input, { password: authSecret as string, ttl: 60 * 60 });
    });

    it('should throw InvalidInputError for invalid userId', async () => {
      const input = { userId: invalidUUID, spaceId: validSpaceId };

      await expect(encodeDocusignState(input)).rejects.toThrow(InvalidInputError);
    });

    it('should throw InvalidInputError for invalid spaceId', async () => {
      const input = { userId: validUserId, spaceId: invalidUUID };

      await expect(encodeDocusignState(input)).rejects.toThrow(InvalidInputError);
    });
  });

  describe('decodeDocusignState', () => {
    it('should return the correct unsealed object for valid sealed string', async () => {
      const input = 'validSealedString';
      const unsealedData = { userId: validUserId, spaceId: validSpaceId };
      (unsealData as jest.Mock).mockResolvedValue(unsealedData);

      const result = await decodeDocusignState(input);

      expect(result).toEqual(unsealedData);
      expect(unsealData).toHaveBeenCalledWith(input, { password: authSecret as string });
    });

    it('should throw InvalidInputError for invalid userId in unsealed data', async () => {
      const input = 'invalidSealedStringUserId';
      const unsealedData = { userId: invalidUUID, spaceId: validSpaceId };
      (unsealData as jest.Mock).mockResolvedValue(unsealedData);

      await expect(decodeDocusignState(input)).rejects.toThrow(InvalidInputError);
    });

    it('should throw InvalidInputError for invalid spaceId in unsealed data', async () => {
      const input = 'invalidSealedStringSpaceId';
      const unsealedData = { userId: validUserId, spaceId: invalidUUID };
      (unsealData as jest.Mock).mockResolvedValue(unsealedData);

      await expect(decodeDocusignState(input)).rejects.toThrow(InvalidInputError);
    });

    it('should handle errors for malformed sealed string', async () => {
      const input = 'malformedSealedString';
      (unsealData as jest.Mock).mockRejectedValue(new Error('Malformed sealed string'));

      await expect(decodeDocusignState(input)).rejects.toThrow(Error);
    });
  });
});
