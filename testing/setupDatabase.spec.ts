import { generateUserAndSpace } from './setupDatabase';

describe('generateUserAndSpace', () => {

  const walletAddress = '0x0bdCC3f24822AD36CE4Fc1fa8Fe9FD6B235f0078';

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

});
