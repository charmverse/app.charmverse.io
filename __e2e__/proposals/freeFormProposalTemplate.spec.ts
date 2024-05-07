import type {
  Page,
  Proposal,
  ProposalEvaluation,
  ProposalEvaluationPermission,
  ProposalReviewer,
  Role,
  Space,
  User
} from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { ProposalWorkflowTyped } from '@charmverse/core/proposals';
import { testUtilsMembers, testUtilsUser } from '@charmverse/core/test';
import { expect, test } from '__e2e__/testWithFixtures';
import { generateUserAndSpace, loginBrowserUser } from '__e2e__/utils/mocks';

import { generateProposalWorkflowWithEvaluations } from 'testing/utils/proposals';

test.describe.serial('Create and use Proposal Template', async () => {
  let space: Space;
  let admin: User;
  let member: User;
  let proposalWorkflow: ProposalWorkflowTyped;

  let secondProposalWorkflow: ProposalWorkflowTyped;
  let role: Role;

  // This will be established once the admin creates the template in the first proposal
  let savedProposalTemplate: Page & {
    proposal: Proposal & {
      evaluations: (ProposalEvaluation & {
        reviewers: ProposalReviewer[];
        permissions: ProposalEvaluationPermission[];
        vote: null;
      })[];
    };
  };

  const templatePageContent = {
    title: 'Proposal template for E2E',
    description: 'Some freeform content'
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
    // Generate a admin and a space for the test
    ({ user: admin, space } = await generateUserAndSpace({
      isAdmin: true,
      memberSpacePermissions: ['createProposals', 'reviewProposals']
    }));

    member = await testUtilsUser.generateSpaceUser({ spaceId: space.id, isAdmin: false });
    await prisma.spaceRole.update({
      where: {
        spaceUser: {
          userId: member.id,
          spaceId: space.id
        }
      },
      data: {
        onboarded: true
      }
    });
    proposalWorkflow = await generateProposalWorkflowWithEvaluations({ spaceId: space.id, title: 'First workflow' });
    secondProposalWorkflow = await generateProposalWorkflowWithEvaluations({
      spaceId: space.id,
      title: 'Second workflow'
    });
    role = await testUtilsMembers.generateRole({
      createdBy: admin.id,
      spaceId: space.id
    });
  });

  test('Create a free form proposal template', async ({ proposalPage, page, proposalsListPage, documentPage }) => {
    // Log in the browser admin
    await loginBrowserUser({ browserPage: page, userId: admin.id });

    await proposalsListPage.goToProposals(space.domain);

    // Go to create proposal template page (Assuming the URL or navigation step to reach there)
    await proposalsListPage.proposalTemplateSelect.click();
    await proposalsListPage.addNewTemplate.click();
    await proposalsListPage.proposalTemplateFreeFormOption.click();

    await expect(proposalPage.workflowSelect).toBeVisible();

    // Select a workflow
    await proposalPage.selectWorkflow(secondProposalWorkflow.id);

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
    await proposalPage.evaluationVoteSettings.click();
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

    // Edit the proposal title
    await proposalPage.documentTitleInput.fill(templatePageContent.title);

    // Edit the proposal content
    await documentPage.typeText(templatePageContent.description);

    await Promise.all([page.waitForResponse('**/api/proposals'), proposalPage.publishNewProposalButton.click()]);

    // Check the actual data
    savedProposalTemplate = (await prisma.page.findFirstOrThrow({
      where: {
        title: templatePageContent.title,
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
    })) as any;

    expect(savedProposalTemplate).toMatchObject(
      expect.objectContaining({
        ...savedProposalTemplate,
        title: templatePageContent.title,
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              attrs: { track: [] },
              content: [{ text: templatePageContent.description, type: 'text' }]
            }
          ]
        } as any,
        proposal: expect.objectContaining({
          ...(savedProposalTemplate.proposal as Proposal),
          status: 'published',
          fields: {
            ...(savedProposalTemplate.proposal.fields as any)
          },
          evaluations: [
            {
              ...savedProposalTemplate.proposal?.evaluations[0],
              permissions: [] as any,
              reviewers: [
                {
                  evaluationId: savedProposalTemplate.proposal?.evaluations[0].id,
                  id: savedProposalTemplate.proposal?.evaluations[0].reviewers[0].id,
                  proposalId: savedProposalTemplate.proposal?.id,
                  roleId: null,
                  systemRole: 'author',
                  userId: null
                }
              ]
            },
            {
              ...savedProposalTemplate.proposal?.evaluations[1],
              permissions: [] as any,
              reviewers: [
                {
                  evaluationId: savedProposalTemplate.proposal?.evaluations[1].id,
                  id: savedProposalTemplate.proposal?.evaluations[1].reviewers[0].id,
                  proposalId: savedProposalTemplate.proposal?.id,
                  roleId: role.id,
                  systemRole: null,
                  userId: null
                }
              ]
            },
            {
              ...savedProposalTemplate.proposal?.evaluations[2],
              permissions: [] as any,
              voteSettings: {
                threshold: voteSettings.threshold,
                type: 'SingleChoice',
                options: voteSettings.customOptions,
                maxChoices: 1,
                durationDays: voteSettings.duration,
                strategy: 'regular',
                tokenAddress: null,
                chainId: null,
                blockNumber: null
              },
              // We just want to save settings, but not create an actual vote
              vote: null,
              reviewers: [
                {
                  evaluationId: savedProposalTemplate.proposal?.evaluations[2].id,
                  id: savedProposalTemplate.proposal?.evaluations[2].reviewers[0].id,
                  proposalId: savedProposalTemplate.proposal?.id,
                  roleId: null,
                  systemRole: 'space_member',
                  userId: null
                }
              ]
            }
          ],
          spaceId: space.id
        } as (typeof savedProposalTemplate)['proposal'] as any)
      } as typeof savedProposalTemplate)
    );
  });

  test('Create a proposal from a template', async ({ proposalsListPage, documentPage, proposalPage, page }) => {
    const userProposalConfig = {
      title: 'User created proposal',
      content: 'This is what I am proposing'
    };

    await loginBrowserUser({ browserPage: page, userId: member.id });
    await proposalsListPage.goToProposals(space.domain);

    await proposalsListPage.proposalTemplateSelect.click();
    await proposalsListPage.getTemplateOptionLocator(savedProposalTemplate.id).click();
    await proposalPage.waitForNewProposalPage();

    await expect(proposalPage.templateSelect).toHaveText(savedProposalTemplate.title);

    // We only need to use to title. The content should come through from the template
    await expect(proposalPage.documentTitleInput).toBeVisible();
    await proposalPage.documentTitleInput.fill(userProposalConfig.title);

    // Check that configuration fields are readonly and user cannot edit proposal
    const reviewerInputs = await proposalPage.getSelectedReviewers();
    await reviewerInputs.nth(1).waitFor();
    const reviewerInput = reviewerInputs.nth(1);

    await expect(reviewerInput).toHaveText(role.name);

    await expect(proposalPage.editRubricCriteriaLabel).toBeDisabled();

    await expect(proposalPage.charmEditor).toHaveText(templatePageContent.description);

    await Promise.all([page.waitForResponse('**/api/proposals'), proposalPage.publishNewProposalButton.click()]);

    const savedUserProposalFromTemplate = await prisma.page.findFirstOrThrow({
      where: {
        title: userProposalConfig.title,
        spaceId: space.id,
        createdBy: member.id
      },
      include: {
        proposal: {
          include: {
            authors: true,
            evaluations: {
              include: {
                reviewers: true,
                permissions: {
                  orderBy: {
                    id: 'asc'
                  }
                },
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

    const userProposalEvaluations = savedUserProposalFromTemplate.proposal?.evaluations;

    expect(savedUserProposalFromTemplate).toMatchObject(
      expect.objectContaining({
        ...savedUserProposalFromTemplate,
        title: userProposalConfig.title,
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              attrs: { track: [] },
              content: [{ text: templatePageContent.description, type: 'text' }]
            }
          ]
        } as any,
        proposal: expect.objectContaining({
          ...(savedUserProposalFromTemplate.proposal as Proposal),
          fields: {
            ...(savedUserProposalFromTemplate as any).proposal.fields
          },
          authors: [{ proposalId: savedUserProposalFromTemplate.proposal?.id, userId: member.id }],
          status: 'published',
          evaluations: [
            {
              ...userProposalEvaluations?.[0],
              reviewers: [
                {
                  evaluationId: userProposalEvaluations?.[0].id,
                  id: userProposalEvaluations?.[0].reviewers[0].id,
                  proposalId: savedUserProposalFromTemplate.proposal?.id,
                  roleId: null,
                  systemRole: 'author',
                  userId: null
                }
              ]
            },
            {
              ...userProposalEvaluations?.[1],
              reviewers: [
                {
                  evaluationId: userProposalEvaluations?.[1].id,
                  id: userProposalEvaluations?.[1].reviewers[0].id,
                  proposalId: savedUserProposalFromTemplate.proposal?.id,
                  roleId: role.id,
                  systemRole: null,
                  userId: null
                }
              ]
            },
            {
              ...savedUserProposalFromTemplate.proposal?.evaluations[2],
              voteSettings: {
                threshold: voteSettings.threshold,
                type: 'SingleChoice',
                options: voteSettings.customOptions,
                maxChoices: 1,
                durationDays: voteSettings.duration,
                strategy: 'regular',
                tokenAddress: null,
                chainId: null,
                blockNumber: null
              },
              // We just want to save settings, but not create an actual vote
              vote: null,
              reviewers: [
                {
                  evaluationId: savedUserProposalFromTemplate.proposal?.evaluations[2].id,
                  id: savedUserProposalFromTemplate.proposal?.evaluations[2].reviewers[0].id,
                  proposalId: savedUserProposalFromTemplate.proposal?.id,
                  roleId: null,
                  systemRole: 'space_member',
                  userId: null
                }
              ]
            }
          ],
          spaceId: space.id
        } as (typeof savedUserProposalFromTemplate)['proposal'] as any)
      } as typeof savedUserProposalFromTemplate)
    );

    // Manually compare permissions since playwright matchers can be limited for highly nested objects
    for (let i = 0; i < userProposalEvaluations!.length; i++) {
      const evaluation = userProposalEvaluations![i];
      for (const workFlowPermission of secondProposalWorkflow.evaluations[i].permissions) {
        expect(
          evaluation.permissions.some(
            (p) =>
              p.operation === workFlowPermission.operation &&
              (p.systemRole === workFlowPermission.systemRole ||
                p.userId === workFlowPermission.userId ||
                p.roleId === workFlowPermission.roleId)
          )
        ).toBe(true);
      }
    }
  });
});
