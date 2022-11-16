import { prisma } from 'db';

async function addJoinDateMemberDirectoryProperty () {
  const spaces = await prisma.space.findMany({
    orderBy: {
      createdAt: "asc"
    },
    select: {
      memberProperties: true,
      id: true,
      createdBy: true
    }
  });

  for (const space of spaces) {
    const { memberProperties } = space;
    const profilePicMemberProperty = memberProperties.find(mp => mp.type === "profile_pic");
    if (profilePicMemberProperty) {
      memberProperties.sort((a, b) => a.index - b.index);
      const firstProperty = memberProperties[0]; // most likely "Name"
      await prisma.$transaction([
        prisma.memberProperty.create({
          data: {
            index: memberProperties.length - 1,
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
