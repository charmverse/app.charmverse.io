import type { ProposalWorkflow, Space, User } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { WorkflowEvaluationJson } from '@charmverse/core/proposals';
import { testUtilsSpaces } from '@charmverse/core/test';
import { expect, test } from '__e2e__/testWithFixtures';
import { v4 as uuid } from 'uuid';

import type { ProposalFields } from 'lib/proposal/interface';

import { generateUser, generateUserAndSpace, loginBrowserUser } from '../utils/mocks';

test.describe.serial('Proposal custom properties', () => {
  let space: Space;
  let admin: User;
  let member: User;
  let proposalInfo: {
    id: string;
    path: string;
  };

  const settingsToTest = {
    proposalTitle: 'Proposal test title',
    evaluationFeedbackTitle: 'Feedback Eval',
    testTextValue: 'Test text when creating draft',
    secondTextValue: 'Second text after proposal exists',
    memberTextValue: 'Member text value'
  };

  const proposalEvaluationPermissions: WorkflowEvaluationJson[] = [
    {
      id: uuid(),
      title: settingsToTest.evaluationFeedbackTitle,
      permissions: [
        { systemRole: 'all_reviewers', operation: 'comment' },
        { operation: 'view', systemRole: 'space_member' }
      ],
      type: 'feedback'
    }
  ];

  let workflow: ProposalWorkflow;

  test.beforeAll(async ({ browser }) => {
    ({ space, user: admin } = await generateUserAndSpace({
      isAdmin: true,
      onboarded: true,
      skipOnboarding: true,
      spaceDomain: `cvt-${uuid()}`
    }));
    member = await generateUser({
      space: { id: space.id }
    });
    await testUtilsSpaces.addSpaceOperations({
      forSpaceId: space.id,
      spaceId: space.id,
      operations: ['createProposals']
    });
    workflow = await prisma.proposalWorkflow.create({
      data: {
        index: 0,
        title: 'Default flow',
        space: { connect: { id: space.id } },
        evaluations: proposalEvaluationPermissions
      }
    });
  });
  test('An admin can create new custom properties', async ({
    proposalsListPage,
    documentPage,
    proposalPage,
    databasePage
  }) => {
    // Initial setup
    await loginBrowserUser({
      browserPage: proposalsListPage.page,
      userId: admin.id
    });

    await proposalsListPage.goToProposals(space.domain);

    await proposalsListPage.waitForProposalsList();

    await proposalsListPage.createProposalButton.click();

    await expect(documentPage.charmEditor).toBeVisible();

    // Configure proposal settings
    await documentPage.documentTitle.click();

    await documentPage.documentTitle.locator('textarea').first().fill(settingsToTest.proposalTitle);

    await documentPage.charmEditor.fill('This is a test proposal');

    // Workflow auto-selected when loading the proposal
    const workflowSelectTextContent = await proposalPage.workflowSelect.textContent();
    expect(workflowSelectTextContent).toBe(workflow.title);

    // Move into configuring the actual evaluation
    await expect(proposalPage.evaluationSettingsSidebar).toBeVisible();

    await proposalPage.addCardPropertyButton.click();

    await databasePage.getPropertyTypeOptionLocator({ type: 'text' }).click();

    const textInput = databasePage.getCardDetailsTextInput();

    await textInput.fill(settingsToTest.testTextValue);

    await expect(textInput).toBeVisible();

    proposalPage.saveDraftButton.click();

    await proposalPage.page.waitForResponse('**/api/proposals');

    // Test proposal data at the database level to ensure correct persistence
    const proposal = await prisma.proposal.findFirstOrThrow({
      where: {
        spaceId: space.id,
        page: {
          title: settingsToTest.proposalTitle,
          type: 'proposal'
        }
      },
      include: {
        evaluations: {
          include: {
            reviewers: true,
            permissions: true,
            rubricCriteria: true
          },
          orderBy: { index: 'asc' }
        },
        page: true
      }
    });

    proposalInfo = {
      id: proposal.id,
      path: proposal.page!.path
    };

    // Make sure value was persisted in the database
    expect(Object.values(proposal.fields as any).some((val) => val === settingsToTest.testTextValue));

    await documentPage.waitForDocumentPage({
      domain: space.domain,
      path: proposal.page!.path
    });
  });

  test('Admin can edit custom properties', async ({ documentPage, databasePage }) => {
    await loginBrowserUser({
      browserPage: documentPage.page,
      userId: admin.id
    });

    await documentPage.goToPage({
      domain: space.domain,
      path: proposalInfo.path
    });

    const textInputOnFirstReload = databasePage.getCardDetailsTextInput();

    await expect(textInputOnFirstReload).toBeVisible();

    // Ensure the value loaded
    await expect(textInputOnFirstReload).toHaveValue(settingsToTest.testTextValue);

    // Set the second value
    await textInputOnFirstReload.fill(settingsToTest.secondTextValue);

    // We need to click elsewhere for the input value to propagate
    await documentPage.documentTitle.click();

    await documentPage.page.reload({ waitUntil: 'domcontentloaded' });

    const textInputOnSecondLoad = databasePage.getCardDetailsTextInput();

    await expect(textInputOnSecondLoad).toHaveValue(settingsToTest.secondTextValue);
  });

  test('A member can set values in their proposal for custom properties created by the admin', async ({
    proposalsListPage,
    documentPage,
    proposalPage,
    databasePage,
    page
  }) => {
    // Initial setup
    await loginBrowserUser({
      browserPage: proposalsListPage.page,
      userId: member.id
    });

    await proposalsListPage.goToProposals(space.domain);

    await proposalsListPage.waitForProposalsList();

    await proposalsListPage.createProposalButton.click();

    await expect(documentPage.charmEditor).toBeVisible();

    // Configure proposal settings
    await documentPage.documentTitle.click();

    await documentPage.documentTitle.locator('textarea').first().fill(settingsToTest.proposalTitle);

    await documentPage.charmEditor.fill('This is a test proposal');

    // Workflow auto-selected when loading the proposal
    await expect(proposalPage.workflowSelect).toHaveText(workflow.title);

    // members cannot see the option to add a custom property
    await expect(proposalPage.addCardPropertyButton).not.toBeVisible();

    const textInput = databasePage.getCardDetailsTextInput();

    await textInput.fill(settingsToTest.memberTextValue);

    await expect(textInput).toBeVisible();

    proposalPage.saveDraftButton.click();

    await proposalPage.page.waitForResponse('**/api/proposals');

    // Test proposal data at the database level to ensure correct persistence
    const memberProposal = await prisma.proposal.findFirstOrThrow({
      where: {
        createdBy: member.id,
        spaceId: space.id,
        page: {
          title: settingsToTest.proposalTitle,
          type: 'proposal'
        }
      },
      include: {
        evaluations: {
          include: {
            reviewers: true,
            permissions: true,
            rubricCriteria: true
          },
          orderBy: { index: 'asc' }
        },
        page: true
      }
    });

    const propertyValues = (memberProposal.fields as ProposalFields).properties as any;

    // Make sure value was persisted in the database
    expect(Object.values(propertyValues).some((val) => val === settingsToTest.memberTextValue)).toBe(true);
  });
});
