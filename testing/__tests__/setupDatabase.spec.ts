import { generateUserAndSpace } from '../setupDatabase';

describe('generateUserAndSpace', () => {

  // Random key format - Ensures no conflicts if this is run against an existing database
  const walletAddress = Math.random().toString();

  it('should return a user and space', async () => {

    const generated = await generateUserAndSpace(walletAddress);

    expect(generated.user).toBeInstanceOf(Object);
    expect(generated.space).toBeInstanceOf(Object);
  });

  it('should always return the same user and space for the same wallet address', async () => {

    const generated = await generateUserAndSpace(walletAddress);
    const generated2 = await generateUserAndSpace(walletAddress);

    expect(generated.user.id).toEqual(generated2.user.id);
    expect(generated.space.id).toEqual(generated2.space.id);
  });

  it('should return the API token object for the space', async () => {

    const generated = await generateUserAndSpace(walletAddress);

    expect(generated.apiToken).toBeDefined();
    expect(generated.apiToken).toBeInstanceOf(Object);
    expect(generated.apiToken.spaceId).toEqual(generated.space.id);
    expect(typeof generated.apiToken.token).toBe('string');
  });

  it('should always return the same api token for that space', async () => {

    const generated = await generateUserAndSpace(walletAddress);
    const generated2 = await generateUserAndSpace(walletAddress);

    expect(generated.apiToken.token).toEqual(generated2.apiToken.token);
  });

});
