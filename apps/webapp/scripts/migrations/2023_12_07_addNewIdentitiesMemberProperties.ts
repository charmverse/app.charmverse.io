import { Prisma, prisma } from '@charmverse/core/prisma-client';

export async function addNewIdentitiesMemberProperties() {
  const spaces = await prisma.space.findMany({
    select: {
      id: true,
      createdBy: true,
      memberProperties: {
        select: {
          type: true
        }
      }
    }
  });

  const totalSpaces = spaces.length;
  let count = 0;

  for (const space of spaces) {
    try {
      const hasGoogleMemberProperty = space.memberProperties.find((p) => p.type === 'google');
      const hasTelegramMemberProperty = space.memberProperties.find((p) => p.type === 'telegram');
      const hasWalletMemberProperty = space.memberProperties.find((p) => p.type === 'wallet');

      const newIdentitiesMemberProperties: Prisma.MemberPropertyCreateManyInput[] = [];
      if (!hasGoogleMemberProperty) {
        newIdentitiesMemberProperties.push({
          createdBy: space.createdBy,
          name: 'Google',
          spaceId: space.id,
          type: 'google',
          updatedBy: space.createdBy
        });
      }

      if (!hasTelegramMemberProperty) {
        newIdentitiesMemberProperties.push({
          createdBy: space.createdBy,
          name: 'Telegram',
          spaceId: space.id,
          type: 'telegram',
          updatedBy: space.createdBy
        });
      }

      if (!hasWalletMemberProperty) {
        newIdentitiesMemberProperties.push({
          createdBy: space.createdBy,
          name: 'Wallet',
          spaceId: space.id,
          type: 'wallet',
          updatedBy: space.createdBy
        });
      }

      if (newIdentitiesMemberProperties.length) {
        await prisma.memberProperty.createMany({
          data: newIdentitiesMemberProperties
        });
      }
    } catch (err) {
      console.error(`Failed to create new identity member properties for space ${space.id}`);
    }

    count += 1;
    console.log(`Created new identity member properties for space ${space.id} (${count}/${totalSpaces})`);
  }
}

addNewIdentitiesMemberProperties();
