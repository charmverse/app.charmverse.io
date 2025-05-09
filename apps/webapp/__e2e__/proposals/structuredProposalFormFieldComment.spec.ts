import type { Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import { baseUrl } from '@packages/config/constants';
import {
  getDefaultEvaluation,
  getDefaultFeedbackEvaluation
} from '@packages/lib/proposals/workflows/defaultEvaluation';
import { expect, test } from '__e2e__/testWithFixtures';
import { v4 as uuid } from 'uuid';

import { loginBrowserUser } from '../utils/mocks';

let space: Space;
let spaceAdmin: User;
let spaceMember: User;
let proposal: Awaited<ReturnType<typeof testUtilsProposals.generateProposal>>;

test.beforeAll(async () => {
  // Initial setup
  const generated = await testUtilsUser.generateUserAndSpace({
    isAdmin: true,
    spaceName: 'space',
    onboarded: true,
    domain: `cvt-${uuid()}`
  });

  space = generated.space;
  spaceAdmin = generated.user;

  spaceMember = await testUtilsUser.generateSpaceUser({
    spaceId: space.id,
    isAdmin: false
  });

  await prisma.spaceRole.update({
    where: {
      spaceUser: {
        spaceId: space.id,
        userId: spaceMember.id
      }
    },
    data: {
      onboarded: true
    }
  });

  proposal = await testUtilsProposals.generateProposal({
    spaceId: space.id,
    userId: spaceMember.id,
    authors: [spaceMember.id],
    evaluationType: 'pass_fail',
    reviewers: [
      {
        group: 'user',
        id: spaceAdmin.id
      }
    ],
    proposalStatus: 'published'
  });
});

test.describe.serial('Structured proposal template', () => {
  test('Proposal reviewer creates a comment on a form field', async ({
    proposalPage,
    proposalsListPage,
    proposalFormFieldPage,
    page
  }) => {
    const form = await prisma.form.create({
      data: {
        formFields: {
          create: {
            name: 'Short text',
            type: 'short_text'
          }
        },
        proposal: {
          connect: {
            id: proposal.id
          }
        },
        space: {
          connect: {
            id: space.id
          }
        }
      },
      include: {
        formFields: true
      }
    });

    await prisma.formFieldAnswer.create({
      data: {
        fieldId: form.formFields[0].id,
        proposalId: proposal.id,
        type: 'short_text',
        value: 'Hello world'
      }
    });

    await loginBrowserUser({
      browserPage: proposalsListPage.page,
      userId: spaceAdmin.id
    });

    await page.goto(`${baseUrl}/${space.domain}/${proposal.page.path}`);

    await expect(proposalPage.documentTitle).toBeVisible();

    await proposalFormFieldPage.formFieldAnswerComment.click();

    await page.locator('data-test=charm-editor-input').nth(1).fill('This is a comment');

    await page.locator('data-test=save-new-inline-comment-button').click();
  });
});
