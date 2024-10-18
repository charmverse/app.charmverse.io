import { prisma } from '@charmverse/core/prisma-client';
import { Prisma } from '@charmverse/core/prisma';
import { DataNotFoundError } from 'lib/utils/errors';
import { pageStubToCreate } from 'testing/generatePageStub';
import { v4 } from 'uuid';

/**
 *
 * Create a root page with level1 sub pages and level2 child pages per level1 page, and 2 permissions per page inherited from root
 *
 * @nestedPercent The percentage of pages that should have a parent. This is a number between 0 and 100. Defaults to 30
 */
export async function seedTestPages({
  spaceDomain,
  level1Pages,
  level2Pages
}: {
  spaceDomain: string;
  level1Pages: number;
  level2Pages: number;
}) {
  const space = await prisma.space.findUnique({
    where: {
      domain: spaceDomain
    }
  });

  if (!space) {
    throw new DataNotFoundError(`Space with domain ${spaceDomain} not found`);
  }

  const rootPage = pageStubToCreate({
    spaceId: space.id,
    createdBy: space.createdBy,
    title: `Root page - ${new Date().toLocaleDateString()}`
  });

  const createdRootPage = await prisma.page.create({
    data: {
      ...rootPage,
      permissions: {
        createMany: {
          data: [
            {
              permissionLevel: 'full_access',
              spaceId: space.id
            },
            {
              permissionLevel: 'full_access',
              userId: space.createdBy
            }
          ]
        }
      }
    },
    include: {
      permissions: true
    }
  });

  const level1PageInputs: Prisma.PageCreateManyInput[] = [];
  const level1PermissionInputs: Prisma.PagePermissionCreateManyInput[] = [];

  for (let i = 0; i < level1Pages; i++) {
    const generated = pageStubToCreate({
      id: v4(),
      createdBy: space.createdBy,
      spaceId: space.id,
      title: `Page level 1 - ${i + 1}`,
      parentId: rootPage.id
    });

    const permissions = createdRootPage.permissions.map((p) => {
      return {
        pageId: generated.id,
        permissionLevel: p.permissionLevel,
        inheritedFromPermission: p.id,
        spaceId: p.spaceId,
        roleId: p.roleId,
        userId: p.userId,
        public: p.public
      } as Prisma.PagePermissionCreateManyInput;
    });

    level1PageInputs.push(generated);
    level1PermissionInputs.push(...permissions);
  }

  const mappedPermissions = level1PermissionInputs.reduce(
    (acc, val) => {
      if (!acc[val.pageId]) {
        acc[val.pageId] = [];
      }

      acc[val.pageId].push(val);

      return acc;
    },
    {} as Record<string, Prisma.PagePermissionCreateManyInput[]>
  );

  const level2PageInputs: Prisma.PageCreateManyInput[] = [];
  const level2PermissionInputs: Prisma.PagePermissionCreateManyInput[] = [];

  for (let i = 0; i < level2Pages; i++) {
    level1PageInputs.forEach((parentPage) => {
      const generated = pageStubToCreate({
        id: v4(),
        createdBy: space.createdBy,
        spaceId: space.id,
        title: `Page level 1 - ${i + 1}`,
        parentId: parentPage.id
      });

      const permissions = mappedPermissions[parentPage.id as string].map((p) => {
        return {
          pageId: generated.id,
          permissionLevel: p.permissionLevel,
          inheritedFromPermission: p.inheritedFromPermission,
          spaceId: p.spaceId,
          roleId: p.roleId,
          userId: p.userId,
          public: p.public
        } as Prisma.PagePermissionCreateManyInput;
      });

      level2PageInputs.push(generated);
      level2PermissionInputs.push(...permissions);
    });
  }

  await prisma.$transaction([
    prisma.page.createMany({ data: level1PageInputs }),
    prisma.pagePermission.createMany({ data: level1PermissionInputs }),
    prisma.page.createMany({ data: level2PageInputs }),
    prisma.pagePermission.createMany({ data: level2PermissionInputs })
  ]);

  console.log(
    'Created',
    1,
    'Root page // ',
    level1Pages,
    'Level 1 pages // ',
    level1Pages * level2Pages,
    'Level 2 pages'
  );

  console.log('Page inputs', level1PageInputs.length + level2PageInputs.length);
}

seedTestPages({ spaceDomain: 'beneficial-coral-ferret', level1Pages: 2, level2Pages: 150 })
  .then(() => {
    console.log('Done');
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
