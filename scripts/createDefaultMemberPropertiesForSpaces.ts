import { MemberProperty } from '@prisma/client';
import { prisma } from 'db';
import { generateDefaultPropertiesInput } from 'lib/members/generateDefaultPropertiesInput';

async function createDefaultMemberPropertiesForSpaces (): Promise<any> {
  const spaces = await prisma.space.findMany({
    select: {
      id: true,
      createdBy: true,
      // spaceRoles: {
      //   include: {
      //     user: {
      //       select: {
      //         username: true,
      //         id: true
      //       }
      //     }
      //   }
      // }
    },
  });

  for (const space of spaces) {
    // const spaceMembers = space.spaceRoles.map(spaceRole => ({username: spaceRole.user.username, id: spaceRole.user.id}))

    await prisma.memberProperty.createMany({
      data: generateDefaultPropertiesInput({
        spaceId: space.id,
        userId: space.createdBy
      })
    });

    // const nameMemberProperty = await prisma.memberProperty.findFirst({
    //   where: {
    //     spaceId: space.id,
    //     type: "name"
    //   }
    // }) as MemberProperty

    // await prisma.memberPropertyValue.createMany({
    //   data: spaceMembers.map(spaceMember => ({
    //     memberPropertyId: nameMemberProperty.id,
    //     spaceId: space.id,
    //     updatedBy: spaceMember.id,
    //     userId: spaceMember.id,
    //     value: spaceMember.username
    //   }))
    // })
  }
}

/*
createDefaultMemberPropertiesForSpaces()
  .then(() => {
    console.log('Success!');
  });
*/
