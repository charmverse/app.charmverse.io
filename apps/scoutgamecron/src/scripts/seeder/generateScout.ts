import { prisma } from '@charmverse/core/prisma-client';
import { faker } from '@faker-js/faker';
import { randomString } from '@packages/utils/strings';

export async function generateScout({ index }: { index: number }) {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const displayName = `${firstName} ${lastName}`;
  const path = faker.internet
    .userName({
      firstName,
      lastName
    })
    .toLowerCase();
  const email = faker.datatype.boolean()
    ? faker.internet.email({
        firstName
      })
    : undefined;
  const avatar = faker.image.url();

  const scout = await prisma.scout.create({
    data: {
      path,
      displayName,
      email,
      avatar,
      bio: faker.lorem.paragraph(),
      referralCode: randomString(),
      agreedToTermsAt: new Date(),
      onboardedAt: new Date(),
      wallets: {
        create: {
          address: faker.finance.ethereumAddress()
        }
      },
      farcasterId: faker.number.int({ min: 1, max: 500000 }) + index,
      farcasterName: path
    }
  });

  return scout;
}
