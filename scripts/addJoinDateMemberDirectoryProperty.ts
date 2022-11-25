import { prisma } from 'db';

async function addJoinDateMemberDirectoryProperty () {
  const spaces = await prisma.space.findMany({
    orderBy: {
      createdAt: "asc"
    },
    select: {
      memberProperties: {
        orderBy: {
          index: "asc"
        }
      },
      id: true,
      createdBy: true
    }
  });

  for (const space of spaces) {
    const { memberProperties } = space;
    const profilePicMemberProperty = memberProperties.find(mp => mp.type === "profile_pic");
    if (profilePicMemberProperty) {
      const firstProperty = memberProperties[0]; // most likely "Name"
      await prisma.$transaction([
        prisma.memberProperty.create({
          data: {
            index: memberProperties.length,
            createdBy: space.createdBy,
            name: 'Join date',
            spaceId: space.id,
            type: 'join_date',
            updatedBy: space.createdBy,
          }
        }),
        // Interchange profile pic and first property index
        prisma.memberProperty.update({
          where: {
            id: profilePicMemberProperty.id,
          },
          data: {
            index: firstProperty.index
          }
        }),
        prisma.memberProperty.update({
          where: {
            id: firstProperty.id,
          },
          data: {
            index: profilePicMemberProperty.index
          }
        })
      ])
    }
  }
}

addJoinDateMemberDirectoryProperty();
