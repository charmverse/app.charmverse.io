import type { Space, User } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { ProposalWorkflowTyped } from '@charmverse/core/proposals';
import { testUtilsUser } from '@charmverse/core/test';
import { addSpaceOperations } from '@root/lib/permissions/spaces';
import { createProposal } from '@root/lib/proposals/createProposal';
import type { ProposalFields } from '@root/lib/proposals/interfaces';
import { test, expect } from '__e2e__/testWithFixtures';
import { generateUser, loginBrowserUser } from '__e2e__/utils/mocks';
import { v4 as uuid } from 'uuid';

import { defaultWorkflowTitle } from 'lib/proposals/workflows/defaultWorkflows';

let space: Space;
let spaceAdmin: User;
let proposalAuthor: User;
let defaultWorkflows: ProposalWorkflowTyped[];
let proposalTemplateId: string;
let shortTextFieldId: string;

test.beforeAll(async () => {
  const generated = await testUtilsUser.generateUserAndSpace({
    isAdmin: true,
    spaceName: 'space',
    onboarded: true,
    domain: `cvt-${uuid()}`
  });

  await addSpaceOperations({
    forSpaceId: generated.space.id,
    operations: ['createProposals'],
    spaceId: generated.space.id
  });

  space = generated.space;

  spaceAdmin = await generateUser({
    space: { id: space.id, isAdmin: true }
  });

  proposalAuthor = await generateUser({
    space: { id: space.id, isAdmin: false }
  });

  shortTextFieldId = uuid();

  // Set to an exact workflow so selectors always work
  defaultWorkflows = [
    {
      id: uuid(),
      createdAt: new Date(),
      title: defaultWorkflowTitle,
      evaluations: [
        {
          id: uuid(),
          permissions: [{ operation: 'edit', systemRole: 'author' }],
          title: 'Pass',
          type: 'pass_fail'
        }
      ],
      index: 0,
      spaceId: space.id,
      privateEvaluations: false,
      draftReminder: false
    }
  ];

  await prisma.proposalWorkflow.createMany({
    data: defaultWorkflows
  });

  proposalTemplateId = await createProposal({
    authors: [],
    evaluations: defaultWorkflows[0].evaluations.map((ev, index) => ({
      ...ev,
      index,
      reviewers: [{ userId: spaceAdmin.id }],
      rubricCriteria: []
    })),
    spaceId: space.id,
    userId: spaceAdmin.id,
    pageProps: { title: 'Template', type: 'proposal_template' },
    workflowId: defaultWorkflows[0].id,
    formFields: [
      {
        id: shortTextFieldId,
        type: 'short_text',
        name: 'Short text',
        required: true,
        description: 'Short text description',
        fieldConfig: {},
        options: [],
        index: 0,
        private: false,
        dependsOnStepIndex: null
      },
      {
        type: 'milestone',
        name: 'Milestones',
        description: 'Milestone description',
        fieldConfig: {},
        options: [],
        required: false,
        id: uuid(),
        index: 0,
        private: false,
        dependsOnStepIndex: null
      }
    ]
  }).then(({ proposal }) => proposal.id);
});

test('Prevent editing the proposal once it has passed, but allow author to continue editing rewards', async ({
  proposalPage,
  documentPage,
  proposalFormFieldPage,
  proposalsListPage,
  dialogDocumentPage,
  dialogRewardPage,
  databasePage
}) => {
  await loginBrowserUser({
    browserPage: proposalsListPage.page,
    userId: proposalAuthor.id
  });

  await proposalsListPage.goToProposals(space.domain);
  await proposalsListPage.waitForProposalsList();
  await proposalsListPage.proposalTemplateSelect.click();

  await proposalPage.getSelectOption(proposalTemplateId).click();

  await proposalPage.waitForNewProposalPage();

  // Fill out proposal content
  await documentPage.documentTitleInput.fill('Structured proposal');

  await proposalFormFieldPage.getFormFieldInput(shortTextFieldId, 'short_text').fill('Short text value');

  // Configure the reward
  await proposalFormFieldPage.addRewardsButton.click();

  await dialogDocumentPage.documentTitleInput.fill('Reward title 1');

  await dialogRewardPage.openRewardValueDialog.click();
  await dialogRewardPage.rewardPropertyAmount.fill('1');

  await dialogRewardPage.saveRewardValue.click();

  await dialogDocumentPage.saveNewPage.click();

  // Update the proposal
  const proposal = await prisma.proposal.findFirstOrThrow({
    where: {
      createdBy: proposalAuthor.id
    }
  });

  await prisma.proposal.update({
    where: {
      id: proposal.id
    },
    data: {
      status: 'published'
    }
  });

  await prisma.proposalEvaluation.updateMany({
    where: {
      proposalId: proposal.id
    },
    data: {
      result: 'pass'
    }
  });

  await proposalPage.page.reload();

  // Assert editable field does not exist
  await expect(proposalFormFieldPage.getFormFieldInput(shortTextFieldId, 'short_text')).toHaveCount(0);

  // Make sure we can still edit rewards
  await proposalFormFieldPage.addRewardsButton.click();

  await dialogDocumentPage.documentTitleInput.fill('Reward title 2');

  await dialogRewardPage.openRewardValueDialog.click();
  await dialogRewardPage.rewardPropertyAmount.fill('1');

  await dialogRewardPage.saveRewardValue.click();

  await Promise.all([
    dialogDocumentPage.page.waitForResponse('**/proposals/**'),
    dialogDocumentPage.saveNewPage.click()
  ]);

  const proposalAfterUpdate = await prisma.proposal.findUnique({
    where: {
      id: proposal.id
    }
  });

  expect((proposalAfterUpdate?.fields as ProposalFields).pendingRewards).toHaveLength(2);
});
