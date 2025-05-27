import type { ProposalWorkflow, Role, Space, User } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { WorkflowEvaluationJson } from '@charmverse/core/proposals';
import { testUtilsMembers, testUtilsSpaces } from '@charmverse/core/test';
import { expect, test } from '__e2e__/testWithFixtures';
import { v4 as uuid } from 'uuid';

import { generateUser, generateUserAndSpace, loginBrowserUser } from '../utils/mocks';

test.describe.serial('Proposal Evaluation Votes', () => {
  let space: Space;
  let admin: User;
  let member: User;
  let memberWithRole: User;
  let role: Role;
  let workflow: ProposalWorkflow;
  let voteProposalTemplateId: string;
  let voteProposalId: string;
  let voteProposalPath: string;

  const settingsToTest = {
    proposalTemplateTitle: 'Proposal test title',
    memberProposalTitle: 'My proposal for community vote',
    voteDuration: 12,
    votePassThreshold: 70,
    workflowTitle: 'Community vote flow',
    voteStepTitle: 'Community vote'
  };

  const proposalEvaluationPermissions: WorkflowEvaluationJson[] = [
    {
      id: uuid(),
      title: settingsToTest.voteStepTitle,
      permissions: [
        { systemRole: 'all_reviewers', operation: 'comment' },
        { operation: 'view', systemRole: 'space_member' }
      ],
      type: 'vote'
    }
  ];

  test.beforeAll(async ({ browser }) => {
    ({ space, user: admin } = await generateUserAndSpace({
      isAdmin: true,
      onboarded: true,
      skipOnboarding: true,
      spaceDomain: `cvt-${uuid()}`
    }));
    await testUtilsSpaces.addSpaceOperations({
      forSpaceId: space.id,
      spaceId: space.id,
      operations: ['createProposals']
    });
    member = await generateUser({ space: { id: space.id, isAdmin: false } });
    memberWithRole = await generateUser({ space: { id: space.id, isAdmin: false } });
    workflow = await prisma.proposalWorkflow.create({
      data: {
        index: 0,
        title: settingsToTest.workflowTitle,
        space: { connect: { id: space.id } },
        evaluations: proposalEvaluationPermissions
      }
    });
    role = await testUtilsMembers.generateRole({
      createdBy: admin.id,
      spaceId: space.id,
      assigneeUserIds: [memberWithRole.id]
    });
  });
  test('An admin user creates a proposal for community votes', async ({
    proposalListPage,
    documentPage,
    proposalPage,
    page
  }) => {
    // Initial setup
    await loginBrowserUser({
      browserPage: proposalListPage.page,
      userId: admin.id
    });

    await proposalListPage.goToProposals(space.domain);

    await proposalListPage.waitForProposalsList();

    await proposalListPage.proposalTemplateSelect.click();
    await proposalListPage.addNewTemplate.click();
    await proposalListPage.proposalTemplateFreeFormOption.click();

    await expect(documentPage.charmEditor).toBeVisible();

    // Configure proposal settings
    await documentPage.documentTitle.click();

    await Promise.all([
      documentPage.page.waitForResponse('**/api/pages/**'),
      documentPage.documentTitleInput.fill(settingsToTest.proposalTemplateTitle)
    ]);

    await documentPage.charmEditor.fill('This is a test proposal');

    // Workflow auto-selected when loading the proposal
    await expect(proposalPage.workflowSelect).toHaveText(workflow.title);

    // Move into configuring the actual evaluation
    await expect(proposalPage.evaluationSettingsSidebar).toBeVisible();

    // Configure rubric
    await proposalPage.selectEvaluationReviewer('vote', role.id);
    await proposalPage.evaluationVoteSettings.click();

    await proposalPage.evaluationVoteDurationInput.fill(settingsToTest.voteDuration.toString());

    await Promise.all([
      proposalPage.page.waitForResponse('**/evaluation'),
      proposalPage.evaluationVotePassThresholdInput.fill(settingsToTest.votePassThreshold.toString())
    ]);

    await proposalPage.page.reload();

    await expect(proposalPage.publishNewProposalButton).toBeEnabled();
    await Promise.all([proposalPage.page.waitForResponse('**/publish'), proposalPage.publishNewProposalButton.click()]);

    // Test proposal data at the database level to ensure correct persistence
    const proposalTemplate = await prisma.proposal.findFirstOrThrow({
      where: {
        spaceId: space.id,
        page: {
          title: settingsToTest.proposalTemplateTitle,
          type: 'proposal_template'
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

    expect(proposalTemplate.page?.title).toBe(settingsToTest.proposalTemplateTitle);

    expect(proposalTemplate.workflowId).toBe(workflow.id);

    voteProposalTemplateId = proposalTemplate.page!.id;

    expect(proposalTemplate.evaluations[0]).toMatchObject(
      expect.objectContaining({
        type: 'vote',
        index: 0,
        proposalId: proposalTemplate.id,
        title: settingsToTest.voteStepTitle,
        reviewers: [
          expect.objectContaining({
            evaluationId: proposalTemplate.evaluations[0].id,
            id: proposalTemplate.evaluations[0].reviewers[0].id,
            proposalId: proposalTemplate.id,
            roleId: role.id,
            userId: null,
            systemRole: null
          })
        ],
        // Empty permissions since this is a template
        permissions: []
      })
    );
  });

  test('A member creates a vote proposal from the template', async ({
    proposalListPage,
    documentPage,
    proposalPage,
    page
  }) => {
    // Initial setup
    await loginBrowserUser({
      browserPage: proposalListPage.page,
      userId: member.id
    });

    await proposalListPage.goToProposals(space.domain);

    await proposalListPage.proposalTemplateSelect.click();
    await proposalListPage.getTemplateOptionLocator(voteProposalTemplateId).click();
    await proposalPage.waitForNewProposalPage();

    await expect(documentPage.charmEditor).toBeVisible();

    // Configure proposal settings
    await expect(proposalPage.evaluationVoteDurationInput).toHaveValue(settingsToTest.voteDuration.toString());
    await expect(proposalPage.evaluationVotePassThresholdInput).toHaveValue(
      settingsToTest.votePassThreshold.toString()
    );

    await documentPage.documentTitle.click();

    await Promise.all([
      documentPage.page.waitForResponse('**/api/pages/**'),
      documentPage.documentTitleInput.fill(settingsToTest.memberProposalTitle)
    ]);

    await documentPage.charmEditor.fill('This is a test proposal');

    // Workflow auto-selected when loading the proposal
    await expect(proposalPage.workflowSelect).toHaveText(workflow.title);

    await proposalPage.page.reload();

    await expect(proposalPage.publishNewProposalButton).toBeEnabled();

    await Promise.all([proposalPage.page.waitForResponse('**/publish'), proposalPage.publishNewProposalButton.click()]);

    // Test proposal data at the database level to ensure correct persistence
    const proposal = await prisma.proposal.findFirstOrThrow({
      where: {
        spaceId: space.id,
        page: {
          title: settingsToTest.memberProposalTitle,
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

    voteProposalId = proposal.id;
    voteProposalPath = proposal.page!.path;

    expect(proposal.page?.title).toBe(settingsToTest.memberProposalTitle);

    expect(proposal.workflowId).toBe(workflow.id);

    expect(proposal.evaluations[0]).toMatchObject(
      expect.objectContaining({
        type: 'vote',
        index: 0,
        proposalId: proposal.id,
        title: settingsToTest.voteStepTitle,
        reviewers: [
          expect.objectContaining({
            evaluationId: proposal.evaluations[0].id,
            id: proposal.evaluations[0].reviewers[0].id,
            proposalId: proposal.id,
            roleId: role.id,
            userId: null,
            systemRole: null
          })
        ],
        // Empty permissions since this is a template
        permissions: proposal.evaluations[0].permissions
      })
    );

    expect(proposal.evaluations[0].permissions).toHaveLength(proposalEvaluationPermissions[0].permissions.length);

    for (const permission of proposal.evaluations[0].permissions) {
      expect(
        proposalEvaluationPermissions[0].permissions.some(
          (workflowPerm) =>
            workflowPerm.operation === permission.operation &&
            (workflowPerm.systemRole === permission.systemRole ||
              workflowPerm.userId === permission.userId ||
              workflowPerm.roleId === permission.roleId)
        )
      ).toBe(true);
    }
  });

  test('A member without permissions tries to vote', async ({ page, proposalPage }) => {
    await loginBrowserUser({
      browserPage: page,
      userId: member.id
    });

    await proposalPage.goToPage({
      domain: space.domain,
      path: voteProposalPath
    });

    await expect(proposalPage.documentTitle).toHaveText(settingsToTest.memberProposalTitle);

    const yesOption = proposalPage.getVoteOption('Yes');

    await expect(yesOption).toBeVisible();
    await expect(yesOption).toBeDisabled();
  });

  test('A member with permissions submits their vote', async ({ page, proposalPage }) => {
    await loginBrowserUser({
      browserPage: page,
      userId: memberWithRole.id
    });

    await proposalPage.goToPage({
      domain: space.domain,
      path: voteProposalPath
    });

    await expect(proposalPage.documentTitle).toHaveText(settingsToTest.memberProposalTitle);

    const yesOption = proposalPage.getVoteOption('Yes');

    await expect(yesOption).toBeVisible();

    await Promise.all([page.waitForResponse('**/api/votes/**/cast'), yesOption.click()]);

    const proposalVote = await prisma.vote.findFirstOrThrow({
      where: {
        evaluation: {
          proposal: {
            id: voteProposalId
          },
          type: 'vote'
        }
      },
      include: {
        userVotes: true
      }
    });

    expect(proposalVote.userVotes).toHaveLength(1);
    expect(proposalVote.userVotes[0].choices).toEqual(['Yes']);
    expect(proposalVote.userVotes[0].userId).toBe(memberWithRole.id);
  });
});
