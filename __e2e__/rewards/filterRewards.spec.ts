import type { ApplicationStatus, BountyStatus } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import { generateBountyApplication, generateBountyWithSingleApplication } from '@packages/testing/setupDatabase';
import type { E2EFixtures } from '__e2e__/testWithFixtures';
import { expect, test } from '__e2e__/testWithFixtures';
import { loginBrowserUser } from '__e2e__/utils/mocks';

import {
  REWARD_APPLICATION_STATUS_COLORS,
  REWARD_APPLICATION_STATUS_LABELS
} from 'components/rewards/components/RewardApplicationStatusChip';
import {
  APPLICANT_STATUS_BLOCK_ID,
  REWARDS_APPLICANTS_BLOCK_ID,
  REWARD_STATUS_BLOCK_ID
} from 'lib/rewards/blocks/constants';

async function setupTestData() {
  const { space, user: admin } = await testUtilsUser.generateUserAndSpace({ isAdmin: true });

  const firstReward = await generateBountyWithSingleApplication({
    applicationStatus: 'complete',
    bountyStatus: 'complete',
    bountyCap: 10,
    bountyTitle: 'First Reward',
    spaceId: space.id,
    userId: admin.id
  });

  const firstRewardCompletedApplication = firstReward.applications[0];

  const firstRewardSecondApplicationIsPaid = await generateBountyApplication({
    applicationStatus: 'paid',
    bountyId: firstReward.id,
    spaceId: space.id,
    userId: admin.id
  });

  const secondReward = await generateBountyWithSingleApplication({
    applicationStatus: 'applied',
    bountyStatus: 'open',
    bountyCap: 10,
    bountyTitle: 'Second Reward',
    spaceId: space.id,
    userId: admin.id
  });

  const secondRewardApplication = secondReward.applications[0];

  const secondRewardSecondApplicationIsInProgress = await generateBountyApplication({
    applicationStatus: 'inProgress',
    bountyId: secondReward.id,
    spaceId: space.id,
    userId: admin.id
  });

  return {
    admin,
    firstReward,
    firstRewardCompletedApplication,
    firstRewardSecondApplicationIsPaid,
    secondReward,
    secondRewardApplication,
    secondRewardSecondApplicationIsInProgress,
    space
  };
}

export function getLocators({
  databasePage,
  data: {
    firstReward,
    firstRewardCompletedApplication,
    firstRewardSecondApplicationIsPaid,
    secondReward,
    secondRewardApplication,
    secondRewardSecondApplicationIsInProgress
  }
}: Pick<E2EFixtures, 'databasePage'> & { data: Awaited<ReturnType<typeof setupTestData>> }) {
  const locators = {
    firstRewardLocator: databasePage.getTableRowByCardId({ cardId: firstReward.page.id }),
    firstRewardApplicationInReviewLocator: databasePage.getTableRowByCardId({
      cardId: firstRewardCompletedApplication.id
    }),
    firstRewardApplicationPaidLocator: databasePage.getTableRowByCardId({
      cardId: firstRewardSecondApplicationIsPaid.id
    }),
    secondRewardLocator: databasePage.getTableRowByCardId({ cardId: secondReward.page.id }),
    secondRewardApplicationLocator: databasePage.getTableRowByCardId({
      cardId: secondRewardApplication.id
    }),
    secondRewardApplicationInProgressLocator: databasePage.getTableRowByCardId({
      cardId: secondRewardSecondApplicationIsInProgress.id
    })
  };

  return locators;
}

test.describe('Rewards Database Filtering', () => {
  let testData: Awaited<ReturnType<typeof setupTestData>>;

  test.beforeAll(async () => {
    testData = await setupTestData();
  });

  test.beforeEach(async ({ page, rewardPage }) => {
    await loginBrowserUser({ browserPage: page, userId: testData.admin.id });
    await rewardPage.gotoRewardPage({ spaceDomain: testData.space.domain });
  });

  test('All rewards are visible and have the correct information', async ({ databasePage }) => {
    const locators = getLocators({ databasePage, data: testData });

    await expect(locators.firstRewardLocator).toBeVisible();

    // Show reward status but empty application status
    const firstRewardStatus = databasePage.getDatabaseTableCell({
      cardId: testData.firstRewardCompletedApplication.id,
      templateId: APPLICANT_STATUS_BLOCK_ID
    });

    await expect(firstRewardStatus).toHaveText(
      REWARD_APPLICATION_STATUS_LABELS[testData.firstRewardCompletedApplication.status]
    );

    const firstRewardApplicationColumnStatus = databasePage.getDatabaseTableCell({
      cardId: testData.firstRewardCompletedApplication.id,
      templateId: REWARD_STATUS_BLOCK_ID
    });

    await expect(firstRewardApplicationColumnStatus).toHaveText('--');

    // Show application status but empty reward status

    const firstRewardCompletedApplicationStatus = databasePage.getDatabaseTableCell({
      cardId: testData.firstRewardCompletedApplication.id,
      templateId: APPLICANT_STATUS_BLOCK_ID
    });

    await expect(firstRewardCompletedApplicationStatus).toHaveText(
      REWARD_APPLICATION_STATUS_LABELS[testData.firstRewardCompletedApplication.status]
    );

    const firstRewardCompletedApplicationRewardColumnStatus = databasePage.getDatabaseTableCell({
      cardId: testData.firstRewardCompletedApplication.id,
      templateId: REWARD_STATUS_BLOCK_ID
    });

    await expect(firstRewardCompletedApplicationRewardColumnStatus).toHaveText('--');

    // Check rest of cards visible as expected
    await expect(locators.firstRewardApplicationInReviewLocator).toBeVisible();
    await expect(locators.firstRewardApplicationPaidLocator).toBeVisible();
    await expect(locators.secondRewardLocator).toBeVisible();
    await expect(locators.secondRewardApplicationLocator).toBeVisible();
    await expect(locators.secondRewardApplicationInProgressLocator).toBeVisible();
  });

  test('Only second reward (open) is visible', async ({ databasePage }) => {
    const locators = getLocators({ databasePage, data: testData });

    await databasePage.openFiltersButton().click();
    await databasePage.addFilterButton().click();
    await databasePage.selectFilterProperty('Status');
    await databasePage.selectFilterCondition('is');
    await databasePage.selectFilterOptionValue('open');
    await databasePage.closeFilterMenu();

    await expect(locators.firstRewardLocator).not.toBeVisible();
    await expect(locators.firstRewardApplicationInReviewLocator).not.toBeVisible();
    await expect(locators.firstRewardApplicationPaidLocator).not.toBeVisible();
    await expect(locators.secondRewardLocator).toBeVisible();
    await expect(locators.secondRewardApplicationLocator).toBeVisible();
    await expect(locators.secondRewardApplicationInProgressLocator).toBeVisible();

    // Quick test top make sure reset filters works
    await databasePage.resetDatabaseFilters();
    await expect(locators.firstRewardLocator).toBeVisible();
  });

  test('Only first reward (approved) is visible', async ({ databasePage }) => {
    const locators = getLocators({ databasePage, data: testData });

    await databasePage.openFiltersButton().click();
    await databasePage.addFilterButton().click();
    await databasePage.selectFilterProperty('Status');
    await databasePage.selectFilterCondition('is');
    await databasePage.selectFilterOptionValue('complete' as BountyStatus);
    await databasePage.closeFilterMenu();

    await expect(locators.firstRewardLocator).toBeVisible();
    await expect(locators.firstRewardApplicationInReviewLocator).toBeVisible();
    await expect(locators.firstRewardApplicationPaidLocator).toBeVisible();
    await expect(locators.secondRewardLocator).not.toBeVisible();
    await expect(locators.secondRewardApplicationLocator).not.toBeVisible();
    await expect(locators.secondRewardApplicationInProgressLocator).not.toBeVisible();
  });

  test('Filter by reward and application status', async ({ databasePage }) => {
    const locators = getLocators({ databasePage, data: testData });

    await databasePage.openFiltersButton().click();
    await databasePage.addFilterButton().click();
    await databasePage.selectFilterProperty('Status');
    await databasePage.selectFilterCondition('is');
    await databasePage.selectFilterOptionValue('open' as BountyStatus);

    await databasePage.addFilterButton().click();

    await databasePage.selectFilterProperty('Applicant Status', { index: 1 });
    await databasePage.selectFilterCondition('is', { index: 1 });
    await databasePage.selectFilterOptionValue('inProgress' as ApplicationStatus, { index: 1 });
    await databasePage.closeFilterMenu();

    await expect(locators.firstRewardLocator).not.toBeVisible();
    await expect(locators.firstRewardApplicationInReviewLocator).not.toBeVisible();
    await expect(locators.firstRewardApplicationPaidLocator).not.toBeVisible();

    await expect(locators.secondRewardLocator).toBeVisible();
    await expect(locators.secondRewardApplicationLocator).not.toBeVisible();
    await expect(locators.secondRewardApplicationInProgressLocator).toBeVisible();
  });
});
