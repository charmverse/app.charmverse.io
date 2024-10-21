import { resolvePageTree } from '@charmverse/core/pages';
import { Prisma, prisma } from '@charmverse/core/prisma-client';

async function resyncBoardPermissions({ spaceId }: { spaceId: string }) {
  const proposalBoards = await prisma.block.findMany({
    where: {
      spaceId,
      type: 'board',
      fields: {
        path: ['sourceType'],
        equals: 'proposals'
      }
    }
  });

  const pages = await prisma.page.findMany({
    where: {
      id: {
        in: proposalBoards.map((board) => board.id)
      }
    },
    select: {
      id: true,
      permissions: true
    }
  });

  for (const board of pages) {
    const { flatChildren } = await resolvePageTree({
      pageId: board.id,
      flattenChildren: true,
      fullPage: false,
      includeDeletedPages: true
    });

    let sourcePermissions = board.permissions;

    let permissionsToCreate: Prisma.PagePermissionCreateManyInput[] = [];

    flatChildren.forEach((child) => {
      permissionsToCreate.push(
        ...sourcePermissions.map(
          (permission) =>
            ({
              pageId: child.id,
              permissionLevel: permission.permissionLevel,
              allowDiscovery: permission.allowDiscovery,
              inheritedFromPermission: permission.inheritedFromPermission ?? permission.id,
              public: permission.public,
              roleId: permission.roleId,
              spaceId: permission.spaceId,
              userId: permission.userId
            }) as Prisma.PagePermissionCreateManyInput
        )
      );
    });

    await prisma.$transaction([
      prisma.pagePermission.deleteMany({
        where: {
          pageId: {
            in: flatChildren.map((child) => child.id)
          }
        }
      }),
      prisma.pagePermission.createMany({
        data: permissionsToCreate
      })
    ]);
  }
}

async function fixSpaceProposalBoards() {
  const spaces = await prisma.space.findMany({
    where: {
      blocks: {
        some: {
          type: 'board',
          fields: {
            path: ['sourceType'],
            equals: 'proposals'
          }
        }
      }
    }
  });

  console.log(`Found ${spaces.length} spaces with proposal boards`);

  for (let i = 0; i < spaces.length; i++) {
    const space = spaces[i];
    console.log(`Processing space ${i + 1} / ${spaces.length}`);
    await resyncBoardPermissions({ spaceId: space.id });
  }
}

// fixSpaceProposalBoards().then(() => process.exit(0))
