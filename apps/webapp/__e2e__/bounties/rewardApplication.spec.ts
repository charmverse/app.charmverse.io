// import type { Space, User } from '@charmverse/core/prisma';
import type { Application, Bounty, Page, Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import { generateBounty } from '@packages/testing/setupDatabase';

import { REWARD_APPLICATION_STATUS_LABELS } from 'components/rewards/components/RewardApplicationStatusChip';

import { expect, test } from '../testWithFixtures';
import { login } from '../utils/session';

test.describe('Review reward', () => {
  let space: Space;
  let adminUser: User;
  let spaceMember: User;
  let reward: Bounty;
  let application: Application;
  let applicationFromMember: Application;

  test.beforeAll(async () => {
    ({ space, user: adminUser } = await testUtilsUser.generateUserAndSpace({ isAdmin: true }));
    spaceMember = await testUtilsUser.generateSpaceUser({ spaceId: space.id });
    reward = await generateBounty({
      createdBy: adminUser.id,
      spaceId: space.id,
      status: 'open',
      maxSubmissions: 10,
      rewardToken: 'ETH'
    });
    application = await prisma.application.create({
      data: {
        spaceId: space.id,
        status: 'review',
        applicant: {
          connect: {
            id: adminUser.id
          }
        },
        bounty: {
          connect: {
            id: reward.id
          }
        }
      }
    });
    applicationFromMember = await prisma.application.create({
      data: {
        spaceId: space.id,
        status: 'review',
        applicant: {
          connect: {
            id: spaceMember.id
          }
        },
        bounty: {
          connect: {
            id: reward.id
          }
        }
      }
    });
  });

  test('Reward creator can review their own application', async ({ page, rewardPage, databasePage }) => {
    await login({ page, userId: adminUser.id });

    await rewardPage.gotoRewardPage({
      spaceDomain: space.domain
    });

    const secondRow = databasePage.getTableRowByIndex({ index: 1 });

    await secondRow.hover();

    await databasePage.getTableRowOpenLocator(application.id).click();

    await expect(rewardPage.rewardApplicationPage).toBeVisible();

    await expect(rewardPage.rewardApplicationApproveButton).toBeVisible();

    await rewardPage.rewardApplicationApproveButton.click();

    await expect(rewardPage.confirmApproveApplicationButton).toBeVisible();

    await rewardPage.confirmApproveApplicationButton.click();

    // Give the UI some time to refresh
    await page.waitForTimeout(1000);

    const applicationStatus = rewardPage.rewardApplicationPageStatusChip;

    const effectiveStatus = (await applicationStatus.allInnerTexts())[0];

    expect(effectiveStatus).toBe(REWARD_APPLICATION_STATUS_LABELS.complete);
  });

  test('Reward creator can review another users application', async ({ page, rewardPage }) => {
    await login({ page, userId: adminUser.id });

    await rewardPage.openApplication({
      applicationId: applicationFromMember.id,
      spaceDomain: space.domain
    });

    await expect(rewardPage.rewardApplicationPage).toBeVisible();

    await expect(rewardPage.rewardApplicationRejectButton).toBeVisible();

    await rewardPage.rewardApplicationRejectButton.click();

    await expect(rewardPage.confirmRejectApplicationButton).toBeVisible();

    await rewardPage.confirmRejectApplicationButton.click();

    // Give the UI some time to refresh
    await page.waitForTimeout(1000);

    const applicationStatus = rewardPage.rewardApplicationPageStatusChip;

    const effectiveStatus = (await applicationStatus.allInnerTexts())[0];

    expect(effectiveStatus).toBe(REWARD_APPLICATION_STATUS_LABELS.submission_rejected);
  });
});
