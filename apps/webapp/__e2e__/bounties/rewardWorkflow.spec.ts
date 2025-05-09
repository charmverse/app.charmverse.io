import type { Bounty, Page, Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import { baseUrl } from '@packages/config/constants';
import { generateUserAndSpaceKyc } from '@packages/testing/utils/kyc';
import { expect, test } from '__e2e__/testWithFixtures';
import { login } from '__e2e__/utils/session';

test.describe.serial('Review reward applications', () => {
  let space: Space;
  let adminUser: User;
  let reward: Bounty & {
    page: Page;
  };

  test.beforeAll(async () => {
    const { space: generatedSpace, user: generatedUser } = await testUtilsUser.generateUserAndSpace({ isAdmin: true });
    space = generatedSpace;
    adminUser = generatedUser;
  });

  test('Create a draft reward template, change workflow to application required and publish template', async ({
    page,
    rewardPage,
    documentPage,
    databasePage
  }) => {
    await login({ page, userId: adminUser.id });

    await rewardPage.page.goto(`${baseUrl}/${space.domain}/rewards`);

    await rewardPage.rewardTemplateSelect.click();
    await rewardPage.addNewTemplate.click();

    await rewardPage.page.waitForURL('**/rewards/new?**');

    await expect(rewardPage.documentTitleInput).toBeVisible();
    await rewardPage.documentTitleInput.fill('Draft Reward Template');

    await documentPage.addCustomPropertyButton.click();
    await databasePage.getPropertyTypeOptionLocator({ type: 'text' }).click();
    await rewardPage.page.locator('[data-test="card-detail-properties"]').getByPlaceholder('Empty').fill('Text');

    await rewardPage.draftRewardButton.click();
    await rewardPage.page.waitForURL(`**/${space.domain}/draft-reward-template-**`);

    await rewardPage.page.locator('data-test=reward-properties-details').click();
    expect(
      await rewardPage.page.locator('[data-test="card-detail-properties"]').getByPlaceholder('Empty').textContent()
    ).toBe('Text');

    await rewardPage.workflowSelect.click();
    await rewardPage.page.locator(`data-test=select-option-application_required`).click();
    await rewardPage.selectRewardReviewer(adminUser.id);
    await rewardPage.selectRewardType('custom');
    await rewardPage.customRewardInput.fill('Custom Reward');
    await rewardPage.publishRewardButton.click();
    await rewardPage.page.waitForResponse('**/publish');

    reward = (await prisma.bounty.findFirstOrThrow({
      where: {
        spaceId: space.id,
        createdBy: adminUser.id,
        page: {
          title: 'Draft Reward Template'
        }
      },
      include: {
        page: true
      }
    })) as Bounty & {
      page: Page;
    };
  });

  test('Create a reward from template, submit and review application', async ({ page, rewardPage }) => {
    await login({ page, userId: adminUser.id });
    await rewardPage.page.goto(`${baseUrl}/${space.domain}/rewards`);
    await rewardPage.selectRewardTemplate(reward.page.id);
    await expect(rewardPage.documentTitleInput).toBeVisible();

    await rewardPage.documentTitleInput.fill('Reward 1');
    await rewardPage.publishRewardButton.click();

    await rewardPage.page.locator('data-test=reward-properties-details').click();
    expect(
      await rewardPage.page.locator('[data-test="card-detail-properties"]').getByPlaceholder('Empty').textContent()
    ).toBe('Text');

    await rewardPage.newWorkButton.click();
    await rewardPage.writeApplicationInput('My application');
    await rewardPage.submitApplicationButton.click();
    await rewardPage.rewardApplicationApproveButton.click();
    await rewardPage.confirmApproveApplicationButton.click();

    await rewardPage.writeSubmissionInput('My submission');
    await rewardPage.submitSubmissionButton.click();
    await rewardPage.rewardApplicationApproveButton.click();
    await rewardPage.confirmApproveApplicationButton.click();

    await rewardPage.markPaidButton.click();
    await rewardPage.confirmMarkPaidButton.click();
    await rewardPage.page.waitForResponse('**/api/reward-applications/mark-paid**');

    const application = await prisma.application.findFirstOrThrow({
      where: {
        spaceId: space.id,
        status: 'paid'
      }
    });

    expect(application).toBeTruthy();
  });

  test('Go through assigned & KYC workflow', async ({ page, rewardPage }) => {
    await login({ page, userId: adminUser.id });
    await generateUserAndSpaceKyc({ spaceId: space.id, userId: adminUser.id });

    await rewardPage.page.goto(`${baseUrl}/${space.domain}/rewards`);
    await rewardPage.createBountyButton.click();
    await rewardPage.documentTitleInput.fill('Reward 2');

    await rewardPage.workflowSelect.click();
    await rewardPage.page.locator(`data-test=select-option-assigned_kyc`).click();
    await rewardPage.page.locator('data-test=user-select-without-preview').click();
    await rewardPage.page.locator(`data-test=user-option-${adminUser.id}`).click();

    await rewardPage.selectRewardReviewer(adminUser.id);
    await rewardPage.selectRewardType('custom');
    await rewardPage.customRewardInput.fill('Custom Reward');
    await rewardPage.publishRewardButton.click();

    await rewardPage.newWorkButton.click();
    await rewardPage.writeSubmissionInput('My submission 2');
    await rewardPage.submitSubmissionButton.click();
    await rewardPage.rewardApplicationApproveButton.click();
    await rewardPage.confirmApproveApplicationButton.click();

    await rewardPage.markPaidButton.click();
    await rewardPage.confirmMarkPaidButton.click();
    await rewardPage.page.waitForResponse('**/api/reward-applications/mark-paid**');

    const application = await prisma.application.findFirstOrThrow({
      where: {
        spaceId: space.id,
        status: 'paid'
      }
    });

    expect(application).toBeTruthy();
  });
});
