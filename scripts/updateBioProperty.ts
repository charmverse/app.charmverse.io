import { prisma } from 'db';

async function updateBioProperty () {
  // Delete existing bio member property
  await prisma.memberProperty.deleteMany({
    where: {
      type: "text_multiline",
      name: "Bio"
    },
  });

  const spaces = await prisma.space.findMany({select: {
    id: true,
    createdBy: true
  }});

  await prisma.memberProperty.createMany({
    data: spaces.map(({id: spaceId, createdBy}) => ({
      type: "bio",
      name: "Bio",
      spaceId,
      createdBy,
      updatedBy: createdBy
    }))
  });
}

updateBioProperty();
