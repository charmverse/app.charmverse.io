import { prisma } from '@charmverse/core/prisma-client';
import type {
  Proposal,
  ProposalEvaluationPermission,
  Role,
  Space,
  User,
  VoteOptions
} from '@charmverse/core/prisma-client';
import type { ProposalWorkflowTyped } from '@charmverse/core/proposals';
import { testUtilsMembers } from '@charmverse/core/test';
import { generateUserAndSpace, loginBrowserUser } from '__e2e__/utils/mocks';
import { test, expect } from '__e2e__/utils/test';

import { generateProposalWorkflow } from 'testing/utils/proposals';

test.describe('Create Proposal Template', async () => {
  let space: Space;
  let user: User;
  let proposalWorkflow: ProposalWorkflowTyped;
  let secondProposalWorkflow: ProposalWorkflowTyped;
  let role: Role;

  const pageContent = {
    title: 'Proposal template for E2E',
    description: 'This is some proposal content that should show in the template'
  };

  const firstRubricConfig = {
    title: 'First Rubric',
    description: 'First Rubric Description',
    minScore: 1,
    maxScore: 10
  };

  const secondRubricConfig = {
    title: 'Second Rubric',
    description: 'Second Rubric Description',
    minScore: 1,
    maxScore: 20
  };

  const voteSettings = {
    duration: 12,
    threshold: 90,
    customOptions: ['Awesome', 'Maybe', 'Never']
  };

  test.beforeAll(async () => {
    // Generate a user and a space for the test
    ({ user, space } = await generateUserAndSpace({ isAdmin: true }));

    proposalWorkflow = await generateProposalWorkflow({ spaceId: space.id, title: 'First workflow' });
    secondProposalWorkflow = await generateProposalWorkflow({ spaceId: space.id, title: 'Second workflow' });
    role = await testUtilsMembers.generateRole({
      createdBy: user.id,
      spaceId: space.id
    });
  });

  test('Create template and configure', async ({ page, proposalPage, rewardPage, proposalListPage, globalPage }) => {
    // Log in the browser user
    await loginBrowserUser({ browserPage: page, userId: user.id });

    await proposalListPage.goToProposals(space.domain);

    // Go to create proposal template page (Assuming the URL or navigation step to reach there)
    await proposalListPage.proposalTemplateSelect.click();
    await proposalListPage.addNewTemplate.click();
    await proposalListPage.proposalTemplateFreeFormOption.click();

    // Select a workflow
    await proposalPage.selectWorkflow(secondProposalWorkflow.id);

    // await proposalPage.workflowSelect.click();

    // Configure reviewers for rubric evaluation
    await proposalPage.selectEvaluationReviewer('rubric', role.id);

    // Configure first rubric criteria added by default
    await proposalPage.editRubricCriteriaLabel.fill(firstRubricConfig.title);
    await proposalPage.editRubricCriteriaDescription.fill(firstRubricConfig.description);
    await proposalPage.editRubricCriteriaMinScore.fill(firstRubricConfig.minScore.toString());
    await proposalPage.editRubricCriteriaMaxScore.fill(firstRubricConfig.maxScore.toString());

    // Add rubric criteria
    await proposalPage.addRubricCriteriaButton.click();

    // Configure second rubric criteria
    await proposalPage.editNthRubricCriteriaLabel(2).fill(secondRubricConfig.title);
    await proposalPage.editNthRubricCriteriaDescription(2).fill(secondRubricConfig.description);
    // For some reason, we need to move index back by 1 here for filling out the scores
    await proposalPage.editNthRubricCriteriaMinScore(1).fill(secondRubricConfig.minScore.toString());
    await proposalPage.editNthRubricCriteriaMaxScore(1).fill(secondRubricConfig.maxScore.toString());

    // Configure vote settings
    await proposalPage.selectEvaluationReviewer('vote', 'space_member');
    await proposalPage.evaluationVoteDurationInput.fill(voteSettings.duration.toString());
    await proposalPage.evaluationVotePassThresholdInput.fill(voteSettings.threshold.toString());

    // Configure voting type
    await proposalPage.evaluationVoteTypeCustomOptions.click();

    // Delete a vote option - There should be a minimum of 2 left
    await proposalPage.deleteVoteOption(0).click();

    await proposalPage.voteOption(0).fill(voteSettings.customOptions[0]);
    await proposalPage.voteOption(1).fill(voteSettings.customOptions[1]);
    // Add a new option
    await proposalPage.addVoteOption.click();

    // Set the value for the third option
    await proposalPage.voteOption(2).fill(voteSettings.customOptions[2]);

    // Configure the proposal settings
    await proposalPage.documentTitleInput.fill(pageContent.title);
    await proposalPage.charmEditor.click();
    await page.keyboard.type(pageContent.description);

    await proposalPage.saveDraftButton.click();

    await page.waitForResponse('**/api/proposals**');

    // Check the actual data
    const savedProposal = await prisma.page.findFirstOrThrow({
      where: {
        title: pageContent.title,
        spaceId: space.id
      },
      include: {
        proposal: {
          include: {
            evaluations: {
              include: {
                reviewers: true,
                permissions: true,
                vote: true
              },
              orderBy: {
                index: 'asc'
              }
            }
          }
        }
      }
    });

    expect(savedProposal).toMatchObject(
      expect.objectContaining({
        ...savedProposal,
        title: pageContent.title,
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              attrs: { track: [] },
              content: [{ text: pageContent.description, type: 'text' }]
            }
          ]
        } as any,
        proposal: expect.objectContaining({
          ...(savedProposal.proposal as Proposal),
          status: 'draft',
          evaluations: [
            {
              ...savedProposal.proposal?.evaluations[0],
              permissions: [],
              reviewers: [
                {
                  evaluationId: savedProposal.proposal?.evaluations[0].id,
                  id: savedProposal.proposal?.evaluations[0].reviewers[0].id,
                  proposalId: savedProposal.proposal?.id,
                  roleId: null,
                  systemRole: 'author',
                  userId: null
                }
              ]
            },
            {
              ...savedProposal.proposal?.evaluations[1],
              permissions: [],
              reviewers: [
                {
                  evaluationId: savedProposal.proposal?.evaluations[1].id,
                  id: savedProposal.proposal?.evaluations[1].reviewers[0].id,
                  proposalId: savedProposal.proposal?.id,
                  roleId: role.id,
                  systemRole: null,
                  userId: null
                }
              ]
            },
            {
              ...savedProposal.proposal?.evaluations[2],
              permissions: [],
              voteSettings: {
                threshold: voteSettings.threshold,
                type: 'SingleChoice',
                options: voteSettings.customOptions,
                maxChoices: 1,
                publishToSnapshot: false,
                durationDays: voteSettings.duration
              },
              // We just want to save settings, but not create an actual vote
              vote: null,
              reviewers: [
                {
                  evaluationId: savedProposal.proposal?.evaluations[2].id,
                  id: savedProposal.proposal?.evaluations[2].reviewers[0].id,
                  proposalId: savedProposal.proposal?.id,
                  roleId: null,
                  systemRole: 'space_member',
                  userId: null
                }
              ]
            }
          ],
          spaceId: space.id
        } as (typeof savedProposal)['proposal'] as any)
      } as typeof savedProposal)
    );

    // // Configure rubric
    // await proposalPage.rubricCriteriaNameInput.fill('Rubric Criteria Name');
    // await proposalPage.rubricCriteriaDescriptionInput.fill('Description');
    // await proposalPage.rubricCriteriaRangeMinInput.fill('1');
    // await proposalPage.rubricCriteriaRangeMaxInput.fill('5');

    // // Configure vote settings
    // await proposalPage.voteDurationInput.fill('7'); // 7 days for example
    // await proposalPage.voteThresholdInput.fill('60'); // 60% for example

    // // Add some custom rewards (assuming a button to add and fields to fill)
    // await rewardPage.addRewardButton.click();
    // await rewardPage.rewardNameInput.fill('Custom Reward Name');
    // await rewardPage.rewardValueInput.fill('100');

    // // Submit the proposal template creation
    // await proposalPage.createTemplateButton.click();

    // // Ensure data is as expected by checking the existence of the created template
    // // This step highly depends on how the application confirms the creation of a template
    // // Here is an example of checking the confirmation message
    // await expect(page.locator('text=Template created successfully')).toBeVisible();

    // // Optionally, navigate to where the template is listed and verify its presence
    // await page.goto('/proposal-templates');
    // await expect(page.locator('text=Specific Workflow Name')).toBeVisible();
  });
});
