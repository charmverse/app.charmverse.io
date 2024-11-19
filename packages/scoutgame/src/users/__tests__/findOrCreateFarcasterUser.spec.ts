import { jest } from '@jest/globals';
import { uuidFromNumber } from '@packages/utils/uuid';

jest.unstable_mockModule('@packages/farcaster/getFarcasterUserById', () => ({
  getFarcasterUserById: jest.fn()
}));

jest.unstable_mockModule('@packages/scoutgame/users/findOrCreateUser', () => ({
  findOrCreateUser: jest.fn()
}));

const { getFarcasterUserById } = await import('@packages/farcaster/getFarcasterUserById');
const { findOrCreateFarcasterUser } = await import('../findOrCreateFarcasterUser');
const { findOrCreateUser } = await import('../findOrCreateUser');

describe('findOrCreateFarcasterUser', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should create user even if farcaster API call fails', async () => {
    const fid = Math.floor(Math.random() * 10000);

    // Mock getFarcasterUserById to throw error
    (getFarcasterUserById as jest.Mock<typeof getFarcasterUserById>).mockRejectedValue(new Error('API Error'));

    await findOrCreateFarcasterUser({ fid });

    expect(findOrCreateUser).toHaveBeenCalledWith(
      expect.objectContaining({
        displayName: expect.any(String),
        path: expect.any(String),
        newUserId: uuidFromNumber(fid),
        farcasterId: fid
      })
    );
  });
});
