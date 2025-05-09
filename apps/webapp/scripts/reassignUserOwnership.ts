import { stringUtils } from '@charmverse/core/utilities';
import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';

/**
 * Fix a space where some resources are owned by a user who is no longer a member
 *
 * The new owner should be an admin of that space, and will receive resources
 */
async function migrateSpaceResources({
  newOwner,
  previousOwner,
  spaceDomain
}: {
  spaceDomain: string;
  previousOwner: string;
  newOwner: string;
}) {
  // Conduct integrity checks before migrating data over
  if (!spaceDomain) {
    throw new InvalidInputError(`spaceDomain is required`);
  }

  if (!stringUtils.isUUID(newOwner) || !stringUtils.isUUID(previousOwner)) {
    throw new InvalidInputError(`newOwner and previousOwner must be valid UUIDs`);
  }

  const space = await prisma.space.findFirstOrThrow({
    where: {
      domain: spaceDomain
    },
    include: {
      spaceRoles: {
        where: {
          userId: {
            in: [newOwner, previousOwner]
          }
        }
      }
    }
  });

  if (space.spaceRoles.some((sr) => sr.userId === previousOwner)) {
    throw new InvalidInputError('previousOwner must not be a member of the space');
  } else if (!space.spaceRoles.some((sr) => sr.userId === newOwner && sr.isAdmin)) {
    throw new InvalidInputError('newOwner must be an admin of the space');
  }

  await prisma.$transaction([
    // Update resource ownership ---------
    prisma.page.updateMany({
      where: {
        spaceId: space.id,
        createdBy: previousOwner
      },
      data: {
        createdBy: newOwner,
        updatedBy: newOwner
      }
    }),
    prisma.bounty.updateMany({
      where: {
        spaceId: space.id,
        createdBy: previousOwner
      },
      data: {
        createdBy: newOwner
      }
    }),
    prisma.proposal.updateMany({
      where: {
        spaceId: space.id,
        createdBy: previousOwner
      },
      data: {
        createdBy: newOwner
      }
    }),
    prisma.post.updateMany({
      where: {
        spaceId: space.id,
        createdBy: previousOwner
      },
      data: {
        createdBy: newOwner
      }
    }),
    prisma.block.updateMany({
      where: {
        spaceId: space.id,
        createdBy: previousOwner
      },
      data: {
        createdBy: newOwner,
        updatedBy: newOwner
      }
    }),
    prisma.proposalReviewer.deleteMany({
      where: {
        proposal: {
          spaceId: space.id
        },
        userId: previousOwner
      }
    }),
    // Clean out permissions ---------
    prisma.pagePermission.deleteMany({
      where: {
        userId: previousOwner,
        page: {
          spaceId: space.id
        }
      }
    }),
    prisma.bountyPermission.deleteMany({
      where: {
        userId: previousOwner,
        bounty: {
          spaceId: space.id
        }
      }
    })
  ]);
}
