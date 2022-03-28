import { prisma } from 'db';
import { v4 as uuid } from 'uuid';

async function setSpaceRoleIds (): Promise<any> {
  const spaceRoles = await prisma.spaceRole.findMany({
    where: {
      id: undefined
    }
  });

  for (const spaceRole of spaceRoles) {
    const newId = uuid();

    await prisma.spaceRole.update({
      where: {
        spaceUser: {
          spaceId: spaceRole.spaceId,
          userId: spaceRole.userId
        }
      },
      data: {
        id: newId
      }
    });
  }

  return true;

}

/*
setSpaceRoleIds()
  .then(() => {
    console.log('Success!');
  });
*/
