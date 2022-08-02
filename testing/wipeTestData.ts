import { prisma } from 'db';

export default async function wipeTestData (): Promise<true> {

  // We have to delete the space first, as otherwise user-created content (such as bounties) will throw an error on delete
  await prisma.space.deleteMany({});
  await prisma.user.deleteMany({});

  return true;
}
