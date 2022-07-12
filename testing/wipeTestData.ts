import { prisma } from 'db';

export default async function wipeTestData (): Promise<true> {

  // console.log('\r\n-----\r\n-----Test cleanup fired-----\r\n-----\r\n')

  await prisma.bounty.deleteMany({});

  await Promise.all([
    prisma.space.deleteMany({}),
    prisma.user.deleteMany({})
  ]);

  return true;
}
