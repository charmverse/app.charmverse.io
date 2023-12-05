import fs from 'node:fs/promises';
import path from 'node:path';

import type { Prisma, Space } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import { STATIC_PAGES } from 'components/common/PageLayout/components/Sidebar/constants';
import { generateDefaultPostCategories } from 'lib/forums/categories/generateDefaultPostCategories';
import { setDefaultPostCategory } from 'lib/forums/categories/setDefaultPostCategory';
import { generateDefaultPropertiesInput } from 'lib/members/generateDefaultPropertiesInput';
import { logSpaceCreation } from 'lib/metrics/postToDiscord';
import { convertJsonPagesToPrisma } from 'lib/pages/server/convertJsonPagesToPrisma';
import { createPage } from 'lib/pages/server/createPage';
import { generateFirstDiff } from 'lib/pages/server/generateFirstDiff';
import { setupDefaultPaymentMethods } from 'lib/payment-methods/defaultPaymentMethods';
import { updateSpacePermissionConfigurationMode } from 'lib/permissions/meta';
import { memberProfileNames } from 'lib/profile/memberProfiles';
import { createDefaultProposal } from 'lib/proposal/createDefaultProposal';
import { generateDefaultProposalCategoriesInput } from 'lib/proposal/generateDefaultProposalCategoriesInput';
import { upsertDefaultRewardsBoard } from 'lib/rewards/blocks/upsertDefaultRewardsBoard';
import { createDefaultReward } from 'lib/rewards/createDefaultReward';
import { defaultFreeBlockQuota } from 'lib/subscription/constants';
import type { WorkspaceExport } from 'lib/templates/exportWorkspacePages';
import { importWorkspacePages } from 'lib/templates/importWorkspacePages';
import { subscribeToAllEvents, createSigningSecret } from 'lib/webhookPublisher/subscribeToEvents';
import { gettingStartedPage } from 'seedData/gettingStartedPage';
import { proposalTemplates } from 'seedData/proposalTemplates';

import type { SpaceTemplateType } from './config';
import { staticSpaceTemplates } from './config';
import { countSpaceBlocksAndSave } from './countSpaceBlocks/countAllSpaceBlocks';
import { getAvailableDomainName } from './getAvailableDomainName';
import { getSpaceByDomain } from './getSpaceByDomain';

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
      | 'origin'
    >
  >;

export type CreateSpaceProps = {
  spaceData: SpaceCreateInput;
  userId: string;
  extraAdmins?: string[];
  spaceTemplate?: SpaceTemplateType;
  webhookUrl?: string;
  skipTracking?: boolean;
};

export async function createWorkspace({
  spaceData,
  webhookUrl,
  userId,
  spaceTemplate = 'default',
  extraAdmins = []
}: CreateSpaceProps) {
  let domain = spaceData.domain?.toLowerCase();

  if (!domain) {
    domain = await getAvailableDomainName(spaceData.name);
  } else {
    const existingSpace = await getSpaceByDomain(domain);
    if (existingSpace) {
      domain = await getAvailableDomainName(spaceData.name, true);
    }
  }

  const userList = [userId, ...extraAdmins];

  let signingSecret: string | null = null;
  if (webhookUrl) {
    signingSecret = createSigningSecret();
  }

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
      webhookSubscriptionUrl: webhookUrl,
      webhookSigningSecret: signingSecret,
      updatedBy: spaceData.updatedBy ?? userId,
      author: { connect: { id: userId } },
      blockQuota: defaultFreeBlockQuota,
      memberProfiles: memberProfileNames.map((name) => ({ id: name, isHidden: false })),
      features: STATIC_PAGES.map((page) => ({ id: page.feature, isHidden: false })),
      spaceRoles: {
        createMany: {
          data: userList.map((_userId) => ({
            userId: _userId,
            isAdmin: true
          }))
        }
      },
      origin: spaceData.origin
    },
    include: { pages: true }
  });

  // Create all page content in a single transaction

  // ---------- Section for selecting template to create from ----------

  // ---------- Section for selecting template to create from ----------

  const defaultProposalCategories = generateDefaultProposalCategoriesInput(space.id);
  const defaultProperties = generateDefaultPropertiesInput({ userId, spaceId: space.id });
  const defaultPostCategories = generateDefaultPostCategories(space.id);

  await prisma.$transaction([
    prisma.proposalCategory.createMany({ data: defaultProposalCategories }),
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
    }),
    prisma.proposalCategoryPermission.createMany({
      data: defaultProposalCategories.map(
        (category) =>
          ({
            permissionLevel: 'full_access',
            proposalCategoryId: category.id,
            spaceId: space.id
          } as Prisma.ProposalCategoryPermissionCreateManyInput)
      )
    })
  ]);

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
      },
      diffs: {
        create: generateFirstDiff({
          createdBy: userId,
          content: gettingStartedPage.content
        })
      }
    }
  });

  // Create a test reward, and the default rewards views
  await createDefaultReward({
    spaceId: space.id,
    userId: space.createdBy
  });

  await upsertDefaultRewardsBoard({ spaceId: space.id, userId: space.createdBy });

  await createDefaultProposal({
    spaceId: space.id,
    userId: space.createdBy,
    categoryId: defaultProposalCategories[0].id
  });

  // Handle the population of pages data
  if (spaceTemplate === 'default') {
    const sourceDataPath = path.resolve(
      'seedData/space/space-da74cab3-c2b6-40bb-8734-0de5375b0fce-pages-1657887621286'
    );

    const seedPagesTransactionInput = await convertJsonPagesToPrisma({
      folderPath: sourceDataPath,
      spaceId: space.id
    });
    await prisma.$transaction([
      ...seedPagesTransactionInput.blocksToCreate.map((input) => prisma.block.create({ data: input })),
      ...seedPagesTransactionInput.pagesToCreate.map((input) => createPage({ data: { ...input, autoGenerated: true } }))
    ]);
  } else {
    const staticTemplate = staticSpaceTemplates.find((template) => template.id === spaceTemplate);

    if (staticTemplate) {
      const resolvedPath = path.resolve(path.join('lib', 'templates', 'exports', `${staticTemplate.id}.json`));
      const dataToImport: WorkspaceExport = JSON.parse(await fs.readFile(resolvedPath, 'utf-8'));

      await importWorkspacePages({
        targetSpaceIdOrDomain: space.id,
        exportData: {
          pages: [...proposalTemplates, ...dataToImport.pages]
        }
      });
    }
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

  // Add default subscriptions
  if (webhookUrl) {
    await subscribeToAllEvents({ spaceId: space.id, userId });
  }

  // Generate the first count
  await countSpaceBlocksAndSave({ spaceId: space.id });

  logSpaceCreation(space);

  return updatedSpace;
}
