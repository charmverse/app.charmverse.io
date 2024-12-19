import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from 'lib/utils/strings';
import { DateTime } from 'luxon';

async function query() {
  const result = await prisma.githubRepo.findMany({
    where: {
      createdAt: {
        gt: new Date('2024-12-06')
      },
      owner: 'rikahanabi'
    },
    include: {
      events: {
        include: {
          builderEvent: true
        }
      }
    }
  });

  prettyPrint(result);
  console.log(await prisma.githubUser.findFirst({ where: { login: 'rikahanabi' }, include: { builder: true } }));
  console.log(
    await prisma.scout.findFirst({
      where: { id: 'ac1ab2d2-45b6-44a1-b33d-81da68827e3b' },
      include: { githubUsers: true }
    })
  );
}

query();
