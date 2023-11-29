import { prisma } from '@charmverse/core/prisma-client';

export async function populateUserDetailsName() {
  const memberPropertyValues = await prisma.memberPropertyValue.findMany({
    where: {
      memberProperty: {
        type: "name"
      },
      value: {
        not: undefined
      }
    },
    select: {
      userId: true,
      value: true,
    }
  });

  const updatedUserProfileIds = new Set<string>();

  for (const memberPropertyValue of memberPropertyValues) {
    if (memberPropertyValue.value && !updatedUserProfileIds.has(memberPropertyValue.userId)) {
      await prisma.userDetails.updateMany({
        where: {
          user: {
            id: memberPropertyValue.userId
          }
        },
        data: {
          name: memberPropertyValue.value as string
        }
      })
      updatedUserProfileIds.add(memberPropertyValue.userId);
    }
  }
}

populateUserDetailsName();