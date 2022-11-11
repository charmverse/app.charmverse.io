import { prisma } from 'db';

async function updateBioProperty () {
  // // Delete existing bio member property
  const props = await prisma.memberProperty.findMany({
    where: {
      type: "text_multiline",
      name: "Bio"
    },
    include: {
      memberPropertyValues: true
    }
  });

  const emptyBioProps = props.filter(prop => prop.memberPropertyValues.length === 0);
  const bioPropsWithEntry = props.filter(prop => prop.memberPropertyValues.length > 0);

  const r = await prisma.memberProperty.deleteMany({
    where: {
      id: {
        in: emptyBioProps.map(prop => prop.id)
      }
    },
  });
  console.log('Deleted', r.count, 'empty bio properties');
  const r2 = await prisma.memberProperty.updateMany({
    where: {
      id: {
        in: bioPropsWithEntry.map(prop => prop.id)
      }
    },
    data: {
      name: "Workspace Bio"
    },
  });
  console.log('Renamed', r2.count, 'bio properties');
  const spaces = await prisma.space.findMany({
    include: {
      memberProperty: true
    }
  });

  const spacesWithoutBio = spaces.filter(s => s.memberProperty.every(p => p.type !== 'bio'));

  const r3 = await prisma.memberProperty.createMany({
    data: spacesWithoutBio.map(({id: spaceId, createdBy}) => ({
      type: "bio",
      name: "Bio",
      spaceId,
      createdBy,
      updatedBy: createdBy
    }))
  });

  console.log('Added bio prop for', r3.count, 'spaces');
}

updateBioProperty();
