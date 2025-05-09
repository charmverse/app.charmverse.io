import type { Page, Proposal, Space, User } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentEvaluation } from '@charmverse/core/proposals';
import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import { generateUserAndSpace, loginBrowserUser } from '__e2e__/utils/mocks';
import { expect, test } from '__e2e__/utils/test';

test.describe('Appeal proposal evaluation step', async () => {
  test.describe.configure({ retries: 4 }); // allow retrying appeal test which is very flaky

  let space: Space;
  let admin: User;
  let proposalAuthor: User;
  let appealReviewer: User;
  let proposal1: Proposal & { page: Page };
  let proposal2: Proposal & { page: Page };
  let proposal3: Proposal & { page: Page };
  let proposal4: Proposal & { page: Page };
  let proposal5: Proposal & { page: Page };

  test.beforeAll(async () => {
    ({ user: admin, space } = await generateUserAndSpace({ isAdmin: true }));
    proposalAuthor = await testUtilsUser.generateSpaceUser({ spaceId: space.id, isAdmin: false });
    appealReviewer = await testUtilsUser.generateSpaceUser({ spaceId: space.id, isAdmin: false });

    await prisma.spaceRole.updateMany({
      where: {
        userId: proposalAuthor.id
      },
      data: {
        onboarded: true
      }
    });

    await prisma.spaceRole.updateMany({
      where: {
        userId: appealReviewer.id
      },
      data: {
        onboarded: true
      }
    });

    const args = {
      spaceId: space.id,
      userId: proposalAuthor.id,
      authors: [proposalAuthor.id],
      proposalStatus: 'published',
      pageType: 'proposal',
      title: 'Appeal proposal1 evaluation step 1',
      evaluationInputs: [
        {
          title: 'Spam filter',
          evaluationType: 'pass_fail',
          permissions: [{ assignee: { group: 'current_reviewer' }, operation: 'move' }],
          reviewers: [{ group: 'user', id: admin.id }],
          appealable: true,
          appealRequiredReviews: 1,
          appealReviewers: [{ group: 'user', id: appealReviewer.id }]
        },
        {
          title: 'Rule validation check',
          evaluationType: 'pass_fail',
          permissions: [{ assignee: { group: 'current_reviewer' }, operation: 'move' }],
          finalStep: true,
          reviewers: [{ group: 'user', id: admin.id }]
        },
        {
          title: 'Badge holder check',
          evaluationType: 'pass_fail',
          permissions: [{ assignee: { group: 'current_reviewer' }, operation: 'move' }],
          reviewers: [{ group: 'user', id: admin.id }],
          appealable: true,
          appealRequiredReviews: 1,
          appealReviewers: [{ group: 'user', id: appealReviewer.id }]
        }
      ]
    } as any;
    proposal1 = await testUtilsProposals.generateProposal(args);
    proposal2 = await testUtilsProposals.generateProposal(args);
    proposal3 = await testUtilsProposals.generateProposal(args);
    proposal4 = await testUtilsProposals.generateProposal(args);
    proposal5 = await testUtilsProposals.generateProposal(args);
  });

  test('Appeal a declined evaluation step and appeal reviewer declines the same step', async ({
    page,
    proposalPage
  }) => {
    await loginBrowserUser({ browserPage: page, userId: admin.id });

    await proposalPage.goToPage({ domain: space.domain, path: proposal1.page.path });

    await proposalPage.page.locator('data-test=evaluation-fail-button').nth(0).click();

    await proposalPage.page.waitForResponse('**/submit-result');

    await proposalPage.page.waitForTimeout(1000);

    const proposalEvaluation = await prisma.proposalEvaluation.findFirstOrThrow({
      where: {
        proposalId: proposal1.id,
        index: 0
      },
      select: {
        result: true,
        declinedAt: true
      }
    });

    const proposalEvaluations = await prisma.proposalEvaluation.findMany({
      where: {
        proposalId: proposal1.id
      },
      orderBy: {
        index: 'asc'
      }
    });

    expect(proposalEvaluation.result).toEqual('fail');
    expect(proposalEvaluation.declinedAt).not.toBeNull();
    const currentEvaluation = getCurrentEvaluation(proposalEvaluations)!;

    expect(currentEvaluation.id).toEqual(proposalEvaluations[0].id);

    await loginBrowserUser({ browserPage: page, userId: proposalAuthor.id });

    await proposalPage.goToPage({ domain: space.domain, path: proposal1.page.path });

    await proposalPage.page.locator('data-test=evaluation-appeal-button').nth(0).click();

    await proposalPage.page
      .locator('data-test=appeal-reason-input >> textarea')
      .first()
      .fill('I disagree with the evaluation');

    await proposalPage.page.locator('data-test=appeal-reason-submit-button').click();

    await proposalPage.page.waitForResponse('**/appeal');

    await proposalPage.page.waitForTimeout(1000);

    const proposalEvaluationAfterAppeal = await prisma.proposalEvaluation.findFirstOrThrow({
      where: {
        proposalId: proposal1.id,
        index: 0
      },
      select: {
        result: true,
        appealedAt: true,
        appealedBy: true
      }
    });

    const proposalEvaluationsAfterAppeal = await prisma.proposalEvaluation.findMany({
      where: {
        proposalId: proposal1.id
      },
      orderBy: {
        index: 'asc'
      }
    });

    expect(proposalEvaluationAfterAppeal.result).toEqual(null);
    expect(proposalEvaluationAfterAppeal.appealedAt).not.toBeNull();
    expect(proposalEvaluationAfterAppeal.appealedBy).toEqual(proposalAuthor.id);

    const currentEvaluationAfterAppeal = getCurrentEvaluation(proposalEvaluationsAfterAppeal)!;
    expect(currentEvaluationAfterAppeal.id).toEqual(proposalEvaluationsAfterAppeal[0].id);

    await loginBrowserUser({ browserPage: page, userId: appealReviewer.id });

    await proposalPage.goToPage({ domain: space.domain, path: proposal1.page.path });

    await proposalPage.page.locator('data-test=evaluation-fail-button').nth(0).click();

    await proposalPage.page.waitForResponse('**/appeal/submit-result');

    await proposalPage.page.waitForTimeout(1000);

    const proposalEvaluationsAfterFail = await prisma.proposalEvaluation.findMany({
      where: {
        proposalId: proposal1.id
      },
      orderBy: {
        index: 'asc'
      }
    });

    const currentEvaluationAfterFail = getCurrentEvaluation(proposalEvaluationsAfterFail)!;
    expect(currentEvaluationAfterFail.id).toEqual(proposalEvaluationsAfterFail[0].id);
    expect(currentEvaluationAfterFail.result).toEqual('fail');
  });

  test('Appeal a declined evaluation step and appeal reviewer passes the same step', async ({ page, proposalPage }) => {
    await loginBrowserUser({ browserPage: page, userId: admin.id });

    await proposalPage.goToPage({ domain: space.domain, path: proposal2.page.path });

    await proposalPage.page.locator('data-test=evaluation-fail-button').nth(0).click();

    await proposalPage.page.waitForResponse('**/submit-result');

    await loginBrowserUser({ browserPage: page, userId: proposalAuthor.id });

    await proposalPage.goToPage({ domain: space.domain, path: proposal2.page.path });

    await proposalPage.page.locator('data-test=evaluation-appeal-button').nth(0).click();

    await proposalPage.page
      .locator('data-test=appeal-reason-input >> textarea')
      .first()
      .fill('I disagree with the evaluation');

    await proposalPage.page.locator('data-test=appeal-reason-submit-button').click();

    await proposalPage.page.waitForResponse('**/appeal');

    await loginBrowserUser({ browserPage: page, userId: appealReviewer.id });

    await proposalPage.goToPage({ domain: space.domain, path: proposal2.page.path });

    await proposalPage.page.locator('data-test=evaluation-pass-button').nth(0).click();

    await proposalPage.page.waitForResponse('**/appeal/submit-result');

    const proposalEvaluationsAfterPass = await prisma.proposalEvaluation.findMany({
      where: {
        proposalId: proposal2.id
      },
      orderBy: {
        index: 'asc'
      }
    });

    const currentEvaluationAfterPass = getCurrentEvaluation(proposalEvaluationsAfterPass)!;
    expect(currentEvaluationAfterPass.id).toEqual(proposalEvaluationsAfterPass[0].id);
    expect(currentEvaluationAfterPass.result).toEqual('pass');
  });

  test('Pass spam check step and pass 2nd evaluations step', async ({ page, proposalPage }) => {
    await loginBrowserUser({ browserPage: page, userId: admin.id });

    await proposalPage.goToPage({ domain: space.domain, path: proposal3.page.path });

    await proposalPage.page.locator('data-test=evaluation-pass-button').nth(0).click();

    await proposalPage.page.waitForResponse('**/submit-result');

    await proposalPage.page.waitForTimeout(1000);

    await proposalPage.page.locator('data-test=evaluation-pass-button').nth(0).click();

    await proposalPage.page.waitForResponse('**/submit-result');

    const proposalEvaluationsAfterPass = await prisma.proposalEvaluation.findMany({
      where: {
        proposalId: proposal3.id
      },
      orderBy: {
        index: 'asc'
      }
    });

    const currentEvaluationAfterPass = getCurrentEvaluation(proposalEvaluationsAfterPass)!;
    expect(currentEvaluationAfterPass.id).toEqual(proposalEvaluationsAfterPass[1].id);
    expect(currentEvaluationAfterPass.result).toEqual('pass');
  });

  test('Pass spam check step and fail 2nd evaluations step and pass 3rd step', async ({ page, proposalPage }) => {
    await loginBrowserUser({ browserPage: page, userId: admin.id });

    await proposalPage.goToPage({ domain: space.domain, path: proposal4.page.path });

    await proposalPage.page.locator('data-test=evaluation-pass-button').nth(0).click();

    await proposalPage.page.waitForResponse('**/submit-result');

    await proposalPage.page.waitForTimeout(1000);

    await proposalPage.page.locator('data-test=evaluation-fail-button').nth(0).click();

    await proposalPage.page.waitForResponse('**/submit-result');

    await proposalPage.page.waitForTimeout(1000);

    await proposalPage.page.locator('data-test=evaluation-pass-button').nth(0).click();

    await proposalPage.page.waitForResponse('**/submit-result');

    const proposalEvaluationsAfterPass = await prisma.proposalEvaluation.findMany({
      where: {
        proposalId: proposal4.id
      },
      orderBy: {
        index: 'asc'
      }
    });

    const currentEvaluationAfterPass = getCurrentEvaluation(proposalEvaluationsAfterPass)!;
    expect(currentEvaluationAfterPass.id).toEqual(proposalEvaluationsAfterPass[2].id);
    expect(currentEvaluationAfterPass.result).toEqual('pass');
  });

  test('Pass spam check step and fail 2nd evaluations step and fail 3rd step and appeal reviewers also decline', async ({
    page,
    proposalPage
  }) => {
    await loginBrowserUser({ browserPage: page, userId: admin.id });

    await proposalPage.goToPage({ domain: space.domain, path: proposal5.page.path });

    await proposalPage.page.locator('data-test=evaluation-pass-button').nth(0).click();

    await proposalPage.page.waitForResponse('**/submit-result');

    await proposalPage.page.waitForTimeout(1000);

    await proposalPage.page.locator('data-test=evaluation-fail-button').nth(0).click();

    await proposalPage.page.waitForResponse('**/submit-result');

    await proposalPage.page.waitForTimeout(1000);

    await proposalPage.page.locator('data-test=evaluation-fail-button').nth(0).click();

    await proposalPage.page.waitForResponse('**/submit-result');

    const proposalEvaluationsAfterFail = await prisma.proposalEvaluation.findMany({
      where: {
        proposalId: proposal5.id
      },
      orderBy: {
        index: 'asc'
      }
    });

    const currentEvaluationAfterFail = getCurrentEvaluation(proposalEvaluationsAfterFail)!;
    expect(currentEvaluationAfterFail.id).toEqual(proposalEvaluationsAfterFail[2].id);
    expect(currentEvaluationAfterFail.result).toEqual('fail');

    await loginBrowserUser({ browserPage: page, userId: proposalAuthor.id });

    await proposalPage.goToPage({ domain: space.domain, path: proposal5.page.path });

    await proposalPage.page.locator('data-test=evaluation-appeal-button').nth(0).click();

    await proposalPage.page
      .locator('data-test=appeal-reason-input >> textarea')
      .first()
      .fill('I disagree with the evaluation');

    await proposalPage.page.locator('data-test=appeal-reason-submit-button').click();

    await proposalPage.page.waitForResponse('**/appeal');

    const proposalEvaluationsAfterAppeal = await prisma.proposalEvaluation.findMany({
      where: {
        proposalId: proposal5.id
      },
      orderBy: {
        index: 'asc'
      }
    });

    const currentEvaluationAfterAppeal = getCurrentEvaluation(proposalEvaluationsAfterAppeal)!;
    expect(currentEvaluationAfterAppeal.id).toEqual(proposalEvaluationsAfterAppeal[2].id);
    expect(currentEvaluationAfterAppeal.result).toEqual(null);

    await loginBrowserUser({ browserPage: page, userId: appealReviewer.id });

    await proposalPage.goToPage({ domain: space.domain, path: proposal5.page.path });

    await proposalPage.page.locator('data-test=evaluation-fail-button').nth(0).click();

    await proposalPage.page.waitForResponse('**/appeal/submit-result');

    const proposalEvaluationsAfterFail2 = await prisma.proposalEvaluation.findMany({
      where: {
        proposalId: proposal5.id
      },
      orderBy: {
        index: 'asc'
      }
    });

    const currentEvaluationAfterFail2 = getCurrentEvaluation(proposalEvaluationsAfterFail2)!;
    expect(currentEvaluationAfterFail2.id).toEqual(proposalEvaluationsAfterFail2[2].id);
    expect(currentEvaluationAfterFail2.result).toEqual('fail');
  });
});
