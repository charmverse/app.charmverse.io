import { generateUserAndSpaceWithApiToken } from '../setupDatabase';

describe('generateUserAndSpaceWithApiToken', () => {

  // Random key format - Ensures no conflicts if this is run against an existing database
  const walletAddress = Math.random().toString();

  it('should return a user and space', async () => {

    const generated = await generateUserAndSpaceWithApiToken(walletAddress);

    expect(generated.user).toBeInstanceOf(Object);
    expect(generated.space).toBeInstanceOf(Object);
  });

  it('should always return the same user and space for the same wallet address', async () => {

    const generated = await generateUserAndSpaceWithApiToken(walletAddress);
    const generated2 = await generateUserAndSpaceWithApiToken(walletAddress);

    expect(generated.user.id).toEqual(generated2.user.id);
    expect(generated.space.id).toEqual(generated2.space.id);
  });

  it('should return the API token object for the space', async () => {

    const generated = await generateUserAndSpaceWithApiToken(walletAddress);

    expect(generated.apiToken).toBeDefined();
    expect(generated.apiToken).toBeInstanceOf(Object);
    expect(generated.apiToken.spaceId).toEqual(generated.space.id);
    expect(typeof generated.apiToken.token).toBe('string');
  });

  it('should always return the same api token for that space', async () => {

    const generated = await generateUserAndSpaceWithApiToken(walletAddress);
    const generated2 = await generateUserAndSpaceWithApiToken(walletAddress);

    expect(generated.apiToken.token).toEqual(generated2.apiToken.token);
  });

  it('should always generate a different wallet address, space and user if no address is provided', async () => {

    const generated = await generateUserAndSpaceWithApiToken();
    const generated2 = await generateUserAndSpaceWithApiToken();

    expect(generated.user.id).not.toEqual(generated2.user.id);

    expect(generated.space.id).not.toEqual(generated2.space.id);

    expect(generated.user.wallets[0].address).not.toEqual(generated2.user.wallets[0].address);
  });

});
