import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';

import { MEMBER_PROPERTY_CONFIG } from './constants';

export async function togglePrimaryIdentity({ propertyId, toggle }: { propertyId: string; toggle: boolean }) {
  const memberProperty = await prisma.memberProperty.findUniqueOrThrow({
    where: {
      id: propertyId
    },
    select: {
      type: true,
      spaceId: true
    }
  });

  if (!MEMBER_PROPERTY_CONFIG[memberProperty.type].togglePrimaryIdentity) {
    throw new InvalidInputError('Cannot toggle primary identity for this property type');
  }

  if (toggle) {
    await prisma.$transaction([
      prisma.memberProperty.updateMany({
        where: {
          spaceId: memberProperty.spaceId
        },
        data: {
          primaryIdentity: false
        }
      }),
      prisma.memberProperty.update({
        where: {
          id: propertyId
        },
        data: {
          primaryIdentity: toggle,
          required: true
        }
      })
    ]);
  } else {
    await prisma.memberProperty.update({
      where: {
        id: propertyId
      },
      data: {
        primaryIdentity: toggle
      }
    });
  }
}
