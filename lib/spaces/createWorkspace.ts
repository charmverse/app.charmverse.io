import path from 'node:path';

import type { Prisma } from '@prisma/client';

import { prisma } from 'db';
import { generateDefaultPostCategories } from 'lib/forums/categories/generateDefaultPostCategories';
import { setDefaultPostCategory } from 'lib/forums/categories/setDefaultPostCategory';
import { generateDefaultPropertiesInput } from 'lib/members/generateDefaultPropertiesInput';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { updateTrackGroupProfile } from 'lib/metrics/mixpanel/updateTrackGroupProfile';
import { updateTrackUserProfileById } from 'lib/metrics/mixpanel/updateTrackUserProfileById';
import { logSpaceCreation } from 'lib/metrics/postToDiscord';
import { convertJsonPagesToPrisma } from 'lib/pages/server/convertJsonPagesToPrisma';
import { createPage } from 'lib/pages/server/createPage';
import { setupDefaultPaymentMethods } from 'lib/payment-methods/defaultPaymentMethods';
import { updateSpacePermissionConfigurationMode } from 'lib/permissions/meta';
import { generateDefaultCategoriesInput } from 'lib/proposal/generateDefaultCategoriesInput';
import { importWorkspacePages } from 'lib/templates/importWorkspacePages';

import type { SpaceCreateTemplate } from './utils';

export type CreateSpaceProps = {
  spaceData: Omit<Prisma.SpaceCreateInput, 'author'>;
  userId: string;
  createSpaceOption?: SpaceCreateTemplate;
};

export async function createWorkspace({ spaceData, userId, createSpaceOption }: CreateSpaceProps) {
  const space = await prisma.space.create({
    data: { ...spaceData, author: { connect: { id: userId } } },
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
    prisma.postCategory.createMany({ data: defaultPostCategories })
  ]);

  // Handle the population of pages data
  if (!createSpaceOption) {
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
  } else if (createSpaceOption === 'NFT Community') {
    await importWorkspacePages({
      targetSpaceIdOrDomain: space.id,
      exportName: 'cvt-nft-community-template'
    });
  }

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
  trackUserAction('create_new_workspace', { userId, spaceId: space.id });

  return updatedSpace;
}
