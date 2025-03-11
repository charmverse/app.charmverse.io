import type { Prisma } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { InvalidInputError } from '@packages/utils/errors';

import { DEFAULT_MEMBER_PROPERTIES, READONLY_MEMBER_PROPERTIES } from './constants';

type CreatePropertyInput = {
  data: Prisma.MemberPropertyCreateInput;
  userId: string;
  spaceId: string;
};

export async function createMemberProperty({ data, spaceId, userId }: CreatePropertyInput) {
  const properties = await prisma.memberProperty.findMany({
    where: {
      spaceId
    },
    select: {
      type: true
    }
  });

  const createdPropertyType = data.type;
  // Default properties can't be created, readonly property can only be created once
  const isDefaultProperty = DEFAULT_MEMBER_PROPERTIES.includes(createdPropertyType);
  if (isDefaultProperty) {
    throw new InvalidInputError(`Can't create default property ${createdPropertyType}`);
  }
  const isReadonlyProperty = READONLY_MEMBER_PROPERTIES.includes(createdPropertyType);
  const preExistingReadonlyProperty =
    isReadonlyProperty && properties.find((property) => property.type === createdPropertyType);
  if (preExistingReadonlyProperty) {
    throw new InvalidInputError('Readonly properties can only be created once');
  }

  return prisma.memberProperty.create({
    data: {
      ...data,
      updatedBy: userId,
      createdBy: userId
    }
  });
}
