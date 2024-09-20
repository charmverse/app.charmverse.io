import { prisma } from '@charmverse/core/prisma-client';
import { faker } from '@faker-js/faker';

export async function generateScout(params: { isBuilder: boolean } = { isBuilder: false }) {
  const { isBuilder } = params;
  const username = faker.internet.userName().toLowerCase();
  const displayName = `${faker.person.firstName()} ${faker.person.lastName()}`;
  const email = faker.datatype.boolean() ? faker.internet.email() : undefined;
  const avatar = faker.datatype.boolean() ? faker.image.avatar() : undefined;

  const githubUser = isBuilder
    ? {
        id: faker.number.int({ min: 100000, max: 10000000 }),
        login: username,
        email,
        displayName
      }
    : undefined;

  const scout = await prisma.scout.create({
    data: {
      username,
      displayName,
      email,
      avatar,
      bio: faker.lorem.paragraph(),
      agreedToTOS: true,
      onboarded: true,
      walletAddress: faker.finance.ethereumAddress(),
      farcasterId: faker.number.int({ min: 1, max: 5000 }),
      farcasterName: displayName,
      builder: isBuilder,
      githubUser: isBuilder
        ? {
            create: githubUser
          }
        : undefined
    }
  });

  return {
    scout,
    githubUser
  };
}
