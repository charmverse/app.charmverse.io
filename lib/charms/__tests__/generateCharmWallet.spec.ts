import { prisma } from '@charmverse/core/prisma-client';
import { generateUserAndSpace } from '@packages/testing/setupDatabase';
import { generateCharmWallet } from '@root/lib/charms/generateCharmWallet';

describe('generateCharmWallet', () => {
  it('should generate random wallet address and save it as charm wallet for user', async () => {
    const { user } = await generateUserAndSpace({ isAdmin: true });

    const generatedWallet = await generateCharmWallet({ userId: user.id });

    const wallet = await prisma.charmWallet.findUnique({ where: { userId: user.id } });

    expect(wallet).toBeDefined();
    expect(wallet?.id).toBe(generatedWallet.id);
    expect(wallet?.balance).toBe(0);
  });

  it('should generate random wallet address and save it as charm wallet for space', async () => {
    const { space } = await generateUserAndSpace({ isAdmin: true });

    const generatedWallet = await generateCharmWallet({ spaceId: space.id });

    const wallet = await prisma.charmWallet.findUnique({ where: { spaceId: space.id } });

    expect(wallet).toBeDefined();
    expect(wallet?.id).toBe(generatedWallet.id);
    expect(wallet?.balance).toBe(0);
  });

  it('should not override and return existing wallet', async () => {
    const { user } = await generateUserAndSpace({ isAdmin: true });
    const generatedWallet = await generateCharmWallet({ userId: user.id });

    const res = await generateCharmWallet({ userId: user.id });

    expect(res).toBeDefined();
    expect(res?.id).toBe(generatedWallet.id);
    expect(res?.balance).toBe(0);
  });
});
