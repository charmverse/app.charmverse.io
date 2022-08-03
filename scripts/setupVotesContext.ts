import { prisma } from 'db';

export async function populateContext (): Promise<true> {
  await prisma.$transaction([
    prisma.vote.updateMany({
      where: {
        page: {
          type: {
            notIn: ['proposal']
          }
        }
      },
      data: {
        context: 'inline'
      }
    }),
    prisma.vote.updateMany({
      where: {
        page: {
          type: 'proposal'
        }
      },
      data: {
        context: 'proposal'
      }
    })
  ]);

  return true;
}
