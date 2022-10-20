import { prisma } from 'db';
import { NotFoundError } from 'lib/middleware';

export async function populateNamePropertyValue ({
  spaceId,
  userId
}: {
  userId: string;
  spaceId: string;
}) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId
    },
    select: {
      username: true
    }
  });

  const memberProperty = await prisma.memberProperty.findFirst({
    where: {
      type: 'name',
      spaceId
    }
  });

  if (!memberProperty || !user) {
    throw new NotFoundError();
  }

  await prisma.memberPropertyValue.create({
    data: {
      userId,
      memberPropertyId: memberProperty.id,
      spaceId,
      updatedBy: userId,
      value: user.username
    }
  });
}
