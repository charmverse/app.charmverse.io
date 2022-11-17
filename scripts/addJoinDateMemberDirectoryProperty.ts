import { prisma } from 'db';

async function addJoinDateMemberDirectoryProperty () {
  const spaces = await prisma.space.findMany({
    orderBy: {
      createdAt: "asc"
    },
    select: {
      memberProperty: true,
      id: true,
      createdBy: true
    }
  });

  for (const space of spaces) {
    const { memberProperty } = space;
    const profilePicMemberProperty = memberProperty.find(mp => mp.type === "profile_pic");
    if (profilePicMemberProperty) {
      const totalProperties = await prisma.memberProperty.count({
        where: {
          spaceId: space.id
        }
      });
      const firstProperty = memberProperty[0];
      await prisma.$transaction([
        prisma.memberProperty.create({
          data: {
            index: totalProperties - 1,
            createdBy: space.createdBy,
            name: 'Join date',
            spaceId: space.id,
            type: 'join_date',
            updatedBy: space.createdBy,
          }
        }),
        // Interchange profile pic and 0th index property
        prisma.memberProperty.update({
          where: {
            id: profilePicMemberProperty.id,
          },
          data: {
            index: 0
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
