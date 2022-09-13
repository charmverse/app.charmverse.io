import { Prisma, Space } from '@prisma/client';
import { prisma } from 'db';
import { validate } from 'uuid';
import { DataNotFoundError, InvalidInputError } from '../utilities/errors';
import { PublicBountyToggle } from './interfaces';

async function generatePublicBountyPermissionArgs ({ publicBountyBoard, spaceId }: PublicBountyToggle<false>):
Promise<Prisma.PagePermissionDeleteManyArgs | null>
async function generatePublicBountyPermissionArgs ({ publicBountyBoard, spaceId }: PublicBountyToggle<true>):
Promise<Prisma.PagePermissionUpsertArgs[]>
async function generatePublicBountyPermissionArgs ({ publicBountyBoard, spaceId }: PublicBountyToggle):
Promise<(Prisma.PagePermissionDeleteManyArgs | null) | Prisma.PagePermissionUpsertArgs[]> {
  const spaceBountyPages = await prisma.page.findMany({
    where: {
      spaceId,
      bountyId: {
        not: null
      },
      // If creating permissions, target only pages the space can view. Otherwise, lock all bounties down
      permissions: publicBountyBoard ? {
        some: {
          spaceId
        }
      } : undefined
    },
    select: {
      id: true,
      permissions: {
        where: {
          public: true
        }
      }
    }
  });

  if (!publicBountyBoard) {
    const pagePermissionIdArgs = spaceBountyPages.flatMap(({ permissions }) => permissions.map(({ id }) => id));

    if (pagePermissionIdArgs.length === 0) {
      return null;
    }

    const deleteArgs: Prisma.PagePermissionDeleteManyArgs = {
      where: {
        OR: [
          {
            id: {
              in: pagePermissionIdArgs
            }
          },
          {
            inheritedFromPermission: {
              in: pagePermissionIdArgs
            }
          }
        ]
      }
    };

    return deleteArgs;

  }

  // If upserting permissions, we don't want to affect existing pages
  const pageIdArgs = spaceBountyPages.map(({ id }) => id);

  const upsertArgs: Prisma.PagePermissionUpsertArgs[] = pageIdArgs.map((id) => {

    return {
      where: {
        public_pageId: {
          pageId: id,
          public: true
        }
      },
      create: {
        page: {
          connect: {
            id
          }
        },
        permissionLevel: 'view',
        public: true
      },
      update: {
      }
    };
  });

  return upsertArgs;

}

export async function togglePublicBounties ({ spaceId, publicBountyBoard }: PublicBountyToggle): Promise<Space> {

  if (typeof publicBountyBoard !== 'boolean') {
    throw new InvalidInputError('PublicBountyBoard must be true or false.');
  }
  else if (validate(spaceId) === false) {
    throw new InvalidInputError('Please provide a valid space ID.');
  }

  try {
    const spaceAfterUpdate = await prisma.$transaction(async () => {
      const updatedSpace = await prisma.space.update({
        where: { id: spaceId },
        data: {
          publicBountyBoard
        }
      });

      if (publicBountyBoard === true) {
        const upsertArgs = await generatePublicBountyPermissionArgs({ publicBountyBoard, spaceId });

        await Promise.all(upsertArgs.map((args) => prisma.pagePermission.upsert(args)));
      }
      else {
        const deleteArgs = await generatePublicBountyPermissionArgs({ publicBountyBoard, spaceId });

        if (deleteArgs) {
          await prisma.pagePermission.deleteMany(deleteArgs);
        }
      }

      return updatedSpace;
    });

    return spaceAfterUpdate;
  }
  catch (err) {
    throw new DataNotFoundError(`Space ${spaceId} not found.`);
  }

}

