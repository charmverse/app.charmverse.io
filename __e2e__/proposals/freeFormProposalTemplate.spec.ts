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
import { optimism } from 'viem/chains';

import type { ProposalPendingReward } from 'lib/proposal/interface';
import { generateProposalWorkflow } from 'testing/utils/proposals';

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

  const rewardConfig = {
    title: 'First reward',
    description: 'First reward description',
    chain: optimism.id,
    //  USDC Contract Address on OP;
    token: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
    amount: 22
  };

  const secondRewardConfig = {
    title: 'Second reward',
    description: 'Second reward description',
    chain: optimism.id,
    token: 'ETH',
    amount: 10
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
    proposalWorkflow = await generateProposalWorkflow({ spaceId: space.id, title: 'First workflow' });
    secondProposalWorkflow = await generateProposalWorkflow({ spaceId: space.id, title: 'Second workflow' });
    role = await testUtilsMembers.generateRole({
      createdBy: admin.id,
      spaceId: space.id
    });
  });

  test('Create a freeform proposal template with custom rewards', async ({
    page,
    proposalPage,
    rewardPage,
    dialogRewardPage,
    dialogDocumentPage,
    proposalsListPage,
    globalPage,
    documentPage
  }) => {
    // Log in the browser admin
    await loginBrowserUser({ browserPage: page, userId: admin.id });

    await proposalsListPage.goToProposals(space.domain);

    // Go to create proposal template page (Assuming the URL or navigation step to reach there)
    await proposalsListPage.proposalTemplateSelect.click();
    await proposalsListPage.addNewTemplate.click();
    await proposalsListPage.proposalTemplateFreeFormOption.click();

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

    // Edit the proposal title
    await proposalPage.documentTitleInput.fill(templatePageContent.title);

    // Edit the proposal content
    await proposalPage.charmEditor.click();
    await page.keyboard.type(templatePageContent.description);

    // Add a new reward
    await proposalPage.addReward.click();

    // Set reward title and description
    await dialogDocumentPage.documentTitleInput.fill(rewardConfig.title);
    await dialogDocumentPage.charmEditor.click();
    await page.keyboard.type(rewardConfig.description);

    // Open reward token settings
    await dialogRewardPage.openRewardValueDialog.click();

    const USDCLogoUrl = 'https://optimistic.etherscan.io/token/images/usdc_32.png';

    await expect(dialogRewardPage.rewardPropertyChain).toBeVisible();

    await dialogRewardPage.selectRewardChain(rewardConfig.chain);

    await dialogRewardPage.rewardPropertyToken.click();
    await dialogRewardPage.addCustomToken.click();

    await dialogRewardPage.customTokenContractAddressInput.fill(rewardConfig.token);
    await expect(dialogRewardPage.customTokenLogoUrl).toBeVisible();

    await dialogRewardPage.customTokenLogoUrl.fill(USDCLogoUrl);

    await dialogRewardPage.rewardPropertyAmount.fill(rewardConfig.amount.toString());

    await dialogRewardPage.saveTokenPaymentMethod.click();

    await dialogRewardPage.saveRewardValue.click();

    await dialogDocumentPage.saveNewPage.click();

    // Give React some time to set form values before we save
    await page.waitForTimeout(200);

    await proposalPage.saveDraftButton.click();

    await page.waitForResponse('**/api/proposals**');

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

    const pendingReward = (savedProposalTemplate.proposal?.fields as any).pendingRewards[0];

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
          status: 'draft',
          fields: {
            ...(savedProposalTemplate.proposal.fields as any),
            pendingRewards: [
              {
                page: {
                  icon: null,
                  type: 'bounty',
                  title: rewardConfig.title,
                  content: {
                    type: 'doc',
                    content: [
                      {
                        type: 'paragraph',
                        attrs: {
                          track: []
                        },
                        content: [
                          {
                            text: rewardConfig.description,
                            type: 'text'
                          }
                        ]
                      }
                    ]
                  },
                  updatedAt: pendingReward.page.updatedAt,
                  contentText: rewardConfig.description,
                  headerImage: null
                },
                reward: {
                  fields: {
                    isAssigned: false,
                    properties: {
                      __limit: '',
                      __title: '',
                      __rewarder: '',
                      __available: '-',
                      __createdAt: '',
                      __reviewers: [
                        {
                          id: role.id,
                          group: 'role'
                        }
                      ],
                      __applicants: [],
                      __rewardChain: rewardConfig.chain.toString(),
                      __rewardToken: rewardConfig.token,
                      __rewardAmount: rewardConfig.amount,
                      __rewardStatus: '',
                      __rewardCustomValue: '',
                      __rewardProposalLink: '',
                      __rewardApplicantsCount: '0'
                    }
                  },
                  chainId: rewardConfig.chain,
                  reviewers: [
                    {
                      // Reviewer should be auto-assigned from workflow-configured reviewers
                      id: role.id,
                      group: 'role'
                    }
                  ],
                  rewardToken: rewardConfig.token,
                  customReward: null,
                  rewardAmount: rewardConfig.amount,
                  assignedSubmitters: []
                },
                draftId: pendingReward.draftId
              }
            ] as ProposalPendingReward[]
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
                publishToSnapshot: false,
                durationDays: voteSettings.duration
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

  test('Create a proposal from a template', async ({ proposalsListPage, proposalPage, page }) => {
    const userProposalConfig = {
      title: 'User created proposal',
      content: 'This is what I am proposing'
    };

    await loginBrowserUser({ browserPage: page, userId: member.id });
    await proposalsListPage.goToProposals(space.domain);

    await proposalsListPage.proposalTemplateSelect.click();
    await proposalsListPage.getTemplateOptionLocator(savedProposalTemplate.id).click();
    await proposalPage.waitForNewProposalPage(space.domain);

    // We only need to use to title. The content should come through from the template
    await expect(proposalPage.documentTitleInput).toBeVisible();
    await proposalPage.documentTitleInput.fill(userProposalConfig.title);

    // Check that configuration fields are readonly and user cannot edit proposal
    const reviewerInput = (await proposalPage.getSelectedReviewers()).nth(1);

    const value = (await reviewerInput.allInnerTexts())[0].trim();

    expect(value).toEqual(role.name);

    await expect(proposalPage.editRubricCriteriaLabel).toBeDisabled();

    const content = (await proposalPage.charmEditor.allInnerTexts())[0];

    expect(content.trim()).toEqual(templatePageContent.description);

    await proposalPage.saveDraftButton.click();

    await page.waitForResponse('**/api/proposals**');

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

    const pendingReward = (savedUserProposalFromTemplate.proposal?.fields as any).pendingRewards[0];

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
            ...(savedUserProposalFromTemplate as any).proposal.fields,
            pendingRewards: [
              {
                page: {
                  icon: null,
                  type: 'bounty',
                  title: rewardConfig.title,
                  content: {
                    type: 'doc',
                    content: [
                      {
                        type: 'paragraph',
                        attrs: {
                          track: []
                        },
                        content: [
                          {
                            text: rewardConfig.description,
                            type: 'text'
                          }
                        ]
                      }
                    ]
                  },
                  updatedAt: pendingReward.page.updatedAt,
                  contentText: rewardConfig.description,
                  headerImage: null
                },
                reward: {
                  fields: {
                    isAssigned: false,
                    properties: {
                      __limit: '',
                      __title: '',
                      __rewarder: '',
                      __available: '-',
                      __createdAt: '',
                      __reviewers: [
                        {
                          id: role.id,
                          group: 'role'
                        }
                      ],
                      __applicants: [],
                      __rewardChain: rewardConfig.chain.toString(),
                      __rewardToken: rewardConfig.token,
                      __rewardAmount: rewardConfig.amount,
                      __rewardStatus: '',
                      __rewardCustomValue: '',
                      __rewardProposalLink: '',
                      __rewardApplicantsCount: '0'
                    }
                  },
                  chainId: rewardConfig.chain,
                  reviewers: [
                    {
                      // Reviewer should be auto-assigned from workflow-configured reviewers
                      id: role.id,
                      group: 'role'
                    }
                  ],
                  rewardToken: rewardConfig.token,
                  customReward: null,
                  rewardAmount: rewardConfig.amount,
                  // The author should be auto-assigned as a submitter
                  assignedSubmitters: [member.id]
                },
                draftId: pendingReward.draftId
              }
            ] as ProposalPendingReward[]
          },
          authors: [{ proposalId: savedUserProposalFromTemplate.proposal?.id, userId: member.id }],
          status: 'draft',
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
                publishToSnapshot: false,
                durationDays: voteSettings.duration
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
