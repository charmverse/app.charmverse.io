import { prisma } from 'db';

async function addJoinDateMemberDirectoryProperty () {
  const spaces = await prisma.space.findMany({
    orderBy: {
      createdAt: "asc"
    }
  });

  await prisma.memberProperty.createMany({
    data: spaces.map(space => ({
      createdBy: space.createdBy,
      name: 'Join date',
      spaceId: space.id,
      type: 'join_date',
      updatedBy: space.createdBy,
    }))
  })
}

addJoinDateMemberDirectoryProperty();
