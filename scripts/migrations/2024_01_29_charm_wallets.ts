import { prisma } from '@charmverse/core/prisma-client';
import { generateCharmWallet } from 'lib/charms/generateCharmWallet';

async function generateCharmWallets() {
  const spaces = await prisma.space.findMany({ where: { charmWallet: null } });
  console.log('🔥 Generating wallet for spaces:', spaces.length);

  let i = 1;
  for (const space of spaces) {
    console.log('🔥 space', i);
    await generateCharmWallet({ spaceId: space.id });
    i++;
  }

  const users = await prisma.user.findMany({ where: { charmWallet: null } });
  console.log('🔥 Generating wallet for users:', users.length);

  let j = 1;
  for (const user of users) {
    console.log('🔥 user', j);
    await generateCharmWallet({ userId: user.id });
    j++;
  }

}

generateCharmWallets();
