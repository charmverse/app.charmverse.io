import path from 'node:path';

import type { Prisma, Space } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { STATIC_PAGES } from '@packages/features/constants';
import { generateDefaultPostCategories } from '@packages/lib/forums/categories/generateDefaultPostCategories';
import { setDefaultPostCategory } from '@packages/lib/forums/categories/setDefaultPostCategory';
import { generateDefaultPropertiesInput } from '@packages/lib/members/generateDefaultPropertiesInput';
import { setupDefaultPaymentMethods } from '@packages/lib/payment-methods/setupDefaultPaymentMethods';
import { updateSpacePermissionConfigurationMode } from '@packages/lib/permissions/meta';
import { createDefaultProposal } from '@packages/lib/proposals/createDefaultProposal';
import { getDefaultWorkflows } from '@packages/lib/proposals/workflows/defaultWorkflows';
import { upsertDefaultRewardsBoard } from '@packages/lib/rewards/blocks/upsertDefaultRewardsBoard';
import { createDefaultReward, createDefaultRewardTemplate } from '@packages/lib/rewards/createDefaultReward';
import { createSigningSecret, subscribeToAllEvents } from '@packages/lib/webhookPublisher/subscribeToEvents';
import { logSpaceCreation } from '@packages/metrics/postToDiscord';
import { createPage } from '@packages/pages/createPage';
import { generateFirstDiff } from '@packages/pages/generateFirstDiff';
import { memberProfileNames } from '@packages/profile/memberProfiles';
import type { SpaceTemplateType } from '@packages/spaces/config';
import { countSpaceBlocksAndSave } from '@packages/spaces/countSpaceBlocks/countAllSpaceBlocks';
import { getSpaceByDomain } from '@packages/spaces/getSpaceByDomain';
import { calculateSubscriptionCost } from '@packages/subscriptions/calculateSubscriptionCost';
import { tierConfig } from '@packages/subscriptions/constants';
import { parseUnits } from 'viem';
import { base } from 'viem/chains';

import { convertJsonPagesToPrisma } from 'lib/pages/server/convertJsonPagesToPrisma';
import { importSpaceData } from 'lib/templates/importSpaceData';
import { gettingStartedPage } from 'seedData/gettingStartedPage';

import { getAvailableDomainName } from './getAvailableDomainName';

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

  const userList = Array.from(new Set([userId, ...extraAdmins]));

  let signingSecret: string | null = null;
  if (webhookUrl) {
    signingSecret = createSigningSecret();
  }

  const { immediatePayment, priceForMonths } = calculateSubscriptionCost({
    paymentMonths: 2,
    newTier: 'gold',
    currentTier: null
  });

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
      blockQuota: 0,
      memberProfiles: memberProfileNames.map((name) => ({ id: name, isHidden: false })),
      features: STATIC_PAGES.map((page) => ({ id: page.feature, isHidden: false })),
      subscriptionTier: 'gold',
      spaceRoles: {
        createMany: {
          data: userList.map((_userId) => ({
            userId: _userId,
            isAdmin: true
          }))
        }
      },
      origin: spaceData.origin,
      subscriptionContributions: {
        create: {
          decentPayload: {},
          devTokenAmount: parseUnits(priceForMonths.toString(), 18).toString(),
          chainId: base.id
        }
      },
      subscriptionPayments: {
        create: {
          paidTokenAmount: parseUnits(immediatePayment.toString(), 18).toString(),
          subscriptionPeriodStart: new Date(),
          subscriptionPrice: parseUnits(tierConfig.gold.tokenPrice.toString(), 18).toString(),
          subscriptionTier: 'gold'
        }
      },
      subscriptionTierChangeEvents: {
        create: {
          newTier: 'gold',
          previousTier: 'readonly'
        }
      }
    },
    include: { pages: true }
  });

  // ---------- Section for selecting template to create from ----------
  const defaultProperties = generateDefaultPropertiesInput({ userId, spaceId: space.id, addNameProperty: true });
  const defaultPostCategories = generateDefaultPostCategories(space.id);
  const defaultWorkflows = getDefaultWorkflows(space.id);

  // The current NFT community template is the source of the getting started page

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
              permissionLevel: 'view',
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

  await upsertDefaultRewardsBoard({ spaceId: space.id, userId: space.createdBy });

  // Provision default space data
  if (spaceTemplate === 'default') {
    const sourceDataPath = path.resolve(
      `${process.env.REACT_APP_APP_ENV === 'production' || process.env.REACT_APP_APP_ENV === 'staging' ? 'apps/webapp/' : ''}seedData/space/space-da74cab3-c2b6-40bb-8734-0de5375b0fce-pages-1657887621286`
    );

    const seedPagesTransactionInput = await convertJsonPagesToPrisma({
      folderPath: sourceDataPath,
      spaceId: space.id
    });

    await prisma.$transaction([
      prisma.memberProperty.createMany({ data: defaultProperties }),
      ...seedPagesTransactionInput.blocksToCreate.map((input) => prisma.block.create({ data: input })),
      ...seedPagesTransactionInput.pagesToCreate.map((input) =>
        createPage({ data: { ...input, autoGenerated: true } })
      ),
      prisma.proposalWorkflow.createMany({ data: defaultWorkflows }),
      prisma.postCategory.createMany({ data: defaultPostCategories }),
      prisma.postCategoryPermission.createMany({
        data: defaultPostCategories.map(
          (category) =>
            ({
              permissionLevel: 'full_access',
              postCategoryId: category.id,
              spaceId: space.id
            }) as Prisma.PostCategoryPermissionCreateManyInput
        )
      })
    ]);

    const defaultGeneralPostCategory = defaultPostCategories.find((category) => category.name === 'General');

    if (defaultGeneralPostCategory?.id) {
      await setDefaultPostCategory({
        postCategoryId: defaultGeneralPostCategory.id as string,
        spaceId: space.id
      });
    }

    await updateSpacePermissionConfigurationMode({
      permissionConfigurationMode: spaceData.permissionConfigurationMode ?? 'collaborative',
      spaceId: space.id
    });
  } else {
    await importSpaceData({
      targetSpaceIdOrDomain: space.id,
      exportName: spaceTemplate
    });
  }

  // Create a test reward, and the default rewards views
  await createDefaultReward({
    spaceId: space.id,
    userId: space.createdBy
  });

  await createDefaultRewardTemplate({
    spaceId: space.id,
    userId: space.createdBy
  });

  await createDefaultProposal({
    spaceId: space.id,
    userId: space.createdBy
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

  return prisma.space.findUniqueOrThrow({ where: { id: space.id } });
}
