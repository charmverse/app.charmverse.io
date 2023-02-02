import path from 'node:path';

import type { PagePermissionLevel, Prisma, Space } from '@prisma/client';

import { prisma } from 'db';
import { generateDefaultPostCategories } from 'lib/forums/categories/generateDefaultPostCategories';
import { setDefaultPostCategory } from 'lib/forums/categories/setDefaultPostCategory';
import { generateDefaultPropertiesInput } from 'lib/members/generateDefaultPropertiesInput';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { updateTrackGroupProfile } from 'lib/metrics/mixpanel/updateTrackGroupProfile';
import { updateTrackUserProfileById } from 'lib/metrics/mixpanel/updateTrackUserProfileById';
import { logSpaceCreation } from 'lib/metrics/postToDiscord';
import { getPagePath } from 'lib/pages';
import { convertJsonPagesToPrisma } from 'lib/pages/server/convertJsonPagesToPrisma';
import { createPage } from 'lib/pages/server/createPage';
import { setupDefaultPaymentMethods } from 'lib/payment-methods/defaultPaymentMethods';
import { permissionTemplates, updateSpacePermissionConfigurationMode } from 'lib/permissions/meta';
import { generateDefaultCategoriesInput } from 'lib/proposal/generateDefaultCategoriesInput';
import { importWorkspacePages } from 'lib/templates/importWorkspacePages';
import { gettingStartedPage } from 'seedData/gettingStartedPage';

import { getAvailableDomainName } from './getAvailableDomainName';
import { getSpaceByDomain } from './getSpaceByDomain';
import type { SpaceCreateTemplate } from './utils';

export type SpaceCreateInput = Pick<Space, 'name'> &
  Partial<
    Pick<
      Space,
      | 'permissionConfigurationMode'
      | 'domain'
      | 'spaceImage'
      | 'discordServerId'
      | 'xpsEngineId'
      | 'superApiTokenId'
      | 'updatedBy'
    >
  >;

export type CreateSpaceProps = {
  spaceData: SpaceCreateInput;
  userId: string;
  extraAdmins?: string[];
  createSpaceOption?: SpaceCreateTemplate;
};

export async function createWorkspace({ spaceData, userId, createSpaceOption, extraAdmins = [] }: CreateSpaceProps) {
  let domain = spaceData.domain;

  if (!domain) {
    domain = await getAvailableDomainName(spaceData.name);
  } else {
    const existingSpace = await getSpaceByDomain(domain);
    if (existingSpace) {
      domain = await getAvailableDomainName(spaceData.name, true);
    }
  }

  const userList = [userId, ...extraAdmins];

  const space = await prisma.space.create({
    data: {
      name: spaceData.name,
      domain,
      spaceImage: spaceData.spaceImage,
      discordServerId: spaceData.discordServerId,
      xpsEngineId: spaceData.xpsEngineId,
      superApiToken: spaceData.superApiTokenId
        ? {
            connect: {
              id: spaceData.superApiTokenId
            }
          }
        : undefined,
      updatedBy: spaceData.updatedBy ?? userId,
      author: { connect: { id: userId } },
      spaceRoles: {
        createMany: {
          data: userList.map((_userId) => ({
            userId: _userId,
            isAdmin: true
          }))
        }
      }
    },
    include: { pages: true }
  });

  // Create all page content in a single transaction

  // ---------- Section for selecting template to create from ----------

  // ---------- Section for selecting template to create from ----------

  const defaultCategories = generateDefaultCategoriesInput(space.id);
  const defaultProperties = generateDefaultPropertiesInput({ userId, spaceId: space.id });
  const defaultPostCategories = generateDefaultPostCategories(space.id);

  await prisma.$transaction([
    prisma.proposalCategory.createMany({ data: defaultCategories }),
    prisma.memberProperty.createMany({ data: defaultProperties }),
    prisma.postCategory.createMany({ data: defaultPostCategories }),
    prisma.postCategoryPermission.createMany({
      data: defaultPostCategories.map(
        (category) =>
          ({
            permissionLevel: 'full_access',
            postCategoryId: category.id,
            spaceId: space.id
          } as Prisma.PostCategoryPermissionCreateManyInput)
      )
    })
  ]);

  // Handle the population of pages data
  if (!createSpaceOption || createSpaceOption === 'default') {
    const sourceDataPath = path.resolve(
      'seedData/space/space-da74cab3-c2b6-40bb-8734-0de5375b0fce-pages-1657887621286'
    );

    const seedPagesTransactionInput = await convertJsonPagesToPrisma({
      folderPath: sourceDataPath,
      spaceId: space.id
    });
    await prisma.$transaction([
      ...seedPagesTransactionInput.blocksToCreate.map((input) => prisma.block.create({ data: input })),
      ...seedPagesTransactionInput.pagesToCreate.map((input) => createPage({ data: input }))
    ]);
  } else if (createSpaceOption === 'templateNftCommunity') {
    await importWorkspacePages({
      targetSpaceIdOrDomain: space.id,
      exportName: 'cvt-nft-community-template'
    });
  }

  await prisma.page.create({
    data: {
      ...gettingStartedPage,
      content: gettingStartedPage.content as Prisma.InputJsonValue,
      path: 'getting-started',
      index: 0,
      autoGenerated: true,
      updatedBy: userId,
      author: {
        connect: {
          id: userId
        }
      },
      space: {
        connect: {
          id: space.id
        }
      },
      permissions: {
        createMany: {
          data: [
            {
              permissionLevel: 'full_access',
              userId
            },
            {
              permissionLevel: 'full_access',
              spaceId: space.id
            }
          ]
        }
      }
    }
  });

  const defaultGeneralPostCategory = defaultPostCategories.find((category) => category.name === 'General');

  if (defaultGeneralPostCategory?.id) {
    await setDefaultPostCategory({
      postCategoryId: defaultGeneralPostCategory.id as string,
      spaceId: space.id
    });
  }

  const updatedSpace = await updateSpacePermissionConfigurationMode({
    permissionConfigurationMode: spaceData.permissionConfigurationMode ?? 'collaborative',
    spaceId: space.id
  });

  // Add default stablecoin methods
  await setupDefaultPaymentMethods({ spaceIdOrSpace: space });

  logSpaceCreation(space);
  updateTrackGroupProfile(space);
  updateTrackUserProfileById(userId);
  trackUserAction('create_new_workspace', { userId, spaceId: space.id, template: createSpaceOption ?? 'default' });

  return updatedSpace;
}
