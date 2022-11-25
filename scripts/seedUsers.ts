import {validate} from 'uuid'
import {prisma} from 'db'
import randomName from 'lib/utilities/randomName';

export async function seedUsers({spaceDomainOrId, amount}: {spaceDomainOrId: string, amount: number}) {

  const query = validate(spaceDomainOrId) ? {id: spaceDomainOrId} : {domain: spaceDomainOrId}

  const space = await prisma.space.findUnique({where: query});

  if (!space) {
    throw new Error(`Space ${spaceDomainOrId} not found`);
  }

  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < amount; i++) {
      await tx.user.create({
        data: {
          username: randomName(),
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
      })
    }
  });
}

// seedUsers({spaceDomainOrId: 'estimated-defi-mollusk', amount: 10}).then(() => console.log('done'));