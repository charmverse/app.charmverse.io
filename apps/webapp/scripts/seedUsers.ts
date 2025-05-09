import { validate } from 'uuid';
import { prisma } from '@charmverse/core/prisma-client';
import { randomName } from '@packages/utils/randomName';
import { uid } from '@packages/utils/strings';

export async function seedUsers({ spaceDomainOrId, amount }: { spaceDomainOrId: string; amount: number }) {
  const query = validate(spaceDomainOrId) ? { id: spaceDomainOrId } : { domain: spaceDomainOrId };

  const space = await prisma.space.findUnique({ where: query });

  if (!space) {
    throw new Error(`Space ${spaceDomainOrId} not found`);
  }

  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < amount; i++) {
      await tx.user.create({
        data: {
          username: randomName(),
          path: uid(),
          spaceRoles: {
            create: {
              space: {
                connect: {
                  id: space.id
                }
              }
            }
          }
        }
      });
    }
  });
}

seedUsers({ spaceDomainOrId: 'intense-roadmap-loon', amount: 10 }).then(() => console.log('done'));
