import { prisma } from '@charmverse/core/prisma-client';
import type { Space, User } from '@charmverse/core/prisma-client';
import type { ProposalWorkflowTyped } from '@charmverse/core/proposals';
import { testUtilsUser } from '@charmverse/core/test';
import { expect, test } from '__e2e__/testWithFixtures';
import { generateUser, loginBrowserUser } from '__e2e__/utils/mocks';
import { v4 } from 'uuid';

import { createDefaultProject, defaultProjectMember } from 'lib/projects/constants';
import { createProject } from 'lib/projects/createProject';
import type { ProjectWithMembers } from 'lib/projects/interfaces';
import { getDefaultFeedbackEvaluation } from 'lib/proposals/workflows/defaultEvaluation';
import { defaultWorkflowTitle } from 'lib/proposals/workflows/defaultWorkflows';
import { randomETHWalletAddress } from 'lib/utils/blockchain';

let space: Space;
let spaceAdmin: User;
let defaultWorkflows: ProposalWorkflowTyped[];
let project: ProjectWithMembers;
let proposalTemplateId: string;
let shortTextFieldId: string;

test.beforeAll(async () => {
  const generated = await testUtilsUser.generateUserAndSpace({
    isAdmin: true,
    spaceName: 'space',
    onboarded: true,
    domain: `cvt-${v4()}`
  });

  space = generated.space;

  spaceAdmin = await generateUser({
    space: { id: space.id, isAdmin: true }
  });

  // Set to an exact workflow so selectors always work
  defaultWorkflows = [
    {
      id: v4(),
      createdAt: new Date(),
      title: defaultWorkflowTitle,
      evaluations: [getDefaultFeedbackEvaluation()],
      index: 0,
      spaceId: space.id,
      privateEvaluations: false,
      draftReminder: false
    }
  ];

  project = await createProject({
    project: {
      ...createDefaultProject(),
      name: 'Test Project',
      projectMembers: [
        defaultProjectMember({
          teamLead: true,
          email: `test@${v4()}.com`,
          name: 'Test Member'
        }),
        defaultProjectMember({
          email: `test@${v4()}.com`,
          name: 'Test Member 2'
        })
      ]
    },
    userId: spaceAdmin.id
  });

  await prisma.proposalWorkflow.createMany({
    data: defaultWorkflows
  });
});

test.describe.serial('Structured proposal template with project', () => {
  test('Create a structured proposal template with project', async ({
    proposalFormFieldPage,
    documentPage,
    databasePage,
    proposalsListPage,
    proposalPage
  }) => {
    await loginBrowserUser({
      browserPage: proposalsListPage.page,
      userId: spaceAdmin.id
    });

    await proposalsListPage.goToHomePage();

    await proposalsListPage.getSidebarLink('proposals').click();

    await proposalsListPage.waitForProposalsList();

    await proposalsListPage.proposalTemplateSelect.click();

    await databasePage.getNewTemplateButton().click();

    await proposalsListPage.structuredProposalTemplateMenu.click();

    await proposalPage.waitForNewProposalPage();

    await documentPage.documentTitleInput.fill('Structured proposal template');
    await proposalFormFieldPage.toggleProjectFieldConfig({
      fieldName: 'project-description',
      required: false
    });

    await proposalFormFieldPage.toggleProjectFieldConfig({
      fieldName: 'project-walletAddress',
      private: false
    });

    for (const field of ['websites', 'twitter', 'github']) {
      await proposalFormFieldPage.toggleProjectFieldConfig({
        fieldName: `project-${field}`,
        show: false
      });

      await proposalFormFieldPage.page.waitForTimeout(50);
    }

    for (const field of ['socialUrls', 'walletAddress']) {
      await proposalFormFieldPage.toggleProjectFieldConfig({
        fieldName: `project-member-${field}`,
        show: false
      });

      await proposalFormFieldPage.page.waitForTimeout(50);
    }

    await proposalFormFieldPage.addNewFormFieldButton.click();

    await proposalFormFieldPage.getFormFieldNameInput(0).fill('Short Text');

    await proposalFormFieldPage.fieldType.nth(1).click();

    // Once a project field is added, it should not be available again
    expect(await proposalFormFieldPage.page.locator(`data-test=form-field-type-option-project_profile`).count()).toBe(
      0
    );
    await proposalFormFieldPage.page.locator(`data-test=form-field-type-option-short_text`).click();

    await Promise.all([
      proposalPage.page.waitForURL('**/structured-proposal-template*'),
      proposalPage.publishNewProposalButton.click()
    ]);

    await expect(proposalFormFieldPage.getProjectFieldLabel('name')).toHaveText('Project Name*');
    await expect(proposalFormFieldPage.getProjectFieldLabel('description')).toHaveText('Describe your project');
    await expect(proposalFormFieldPage.getProjectFieldLabel('member-name')).toHaveText('Name*');
    await expect(proposalFormFieldPage.getProjectFieldLabel('member-email')).toHaveText('Email*');

    const proposalTemplate = await prisma.proposal.findFirstOrThrow({
      where: {
        spaceId: space.id
      },
      select: {
        page: {
          select: {
            id: true
          }
        },
        form: {
          select: {
            formFields: {
              select: {
                id: true,
                type: true
              }
            }
          }
        }
      }
    });

    proposalTemplateId = proposalTemplate.page!.id;
    shortTextFieldId = proposalTemplate.form!.formFields.find((field) => field.type === 'short_text')!.id;
  });

  test('Publish a structured proposal with existing project, update project fields and add/update existing project member', async ({
    proposalPage,
    documentPage,
    proposalFormFieldPage,
    proposalsListPage
  }) => {
    await loginBrowserUser({
      browserPage: proposalsListPage.page,
      userId: spaceAdmin.id
    });

    await proposalsListPage.goToProposals(space.domain);
    await proposalsListPage.waitForProposalsList();
    await proposalsListPage.proposalTemplateSelect.click();

    await proposalPage.getSelectOption(proposalTemplateId).click();
    await proposalPage.waitForNewProposalPage();
    await documentPage.documentTitleInput.fill('Proposal from structured template');

    // Disabled since no project is selected
    expect(proposalPage.publishNewProposalButton).toBeDisabled();
    await proposalFormFieldPage.clickProjectOption(project.id);
    await proposalFormFieldPage.fillProjectField({ fieldName: 'walletAddress', content: randomETHWalletAddress() });
    await proposalFormFieldPage.fillProjectField({
      fieldName: 'description',
      content: 'This is my project',
      textArea: true
    });
    // Type invalid email
    await proposalFormFieldPage.fillProjectField({ fieldName: 'projectMembers[0].email', content: 'john' });
    // Disabled since project profile has invalid values
    expect(proposalPage.publishNewProposalButton).toBeDisabled();
    await proposalFormFieldPage.fillProjectField({ fieldName: 'projectMembers[0].email', content: 'john@gmail.com' });
    await proposalFormFieldPage.getFormFieldInput(shortTextFieldId, 'short_text').click();
    await proposalFormFieldPage.page.keyboard.type('Short text field');
    await proposalPage.publishNewProposalButton.click();
    await proposalPage.page.waitForURL('**/proposal-from-structured-template*');
    await proposalPage.page.waitForTimeout(500);

    const projectAfterUpdate = await prisma.project.findUniqueOrThrow({
      where: {
        id: project.id
      },
      include: {
        projectMembers: {
          orderBy: [
            {
              teamLead: 'desc'
            },
            {
              createdAt: 'asc'
            }
          ]
        }
      }
    });
    expect(projectAfterUpdate.description).toBe('This is my project');
    expect(projectAfterUpdate.projectMembers[0].email).toBe('john@gmail.com');

    // Add a new project member and update their project fields
    await proposalPage.projectTeamMembersSelect.click();
    await proposalPage.getProjectMemberOption(0).click();
    await proposalFormFieldPage.fillProjectField({ fieldName: 'projectMembers[0].email', content: 'doe@gmail.com' });
    await proposalFormFieldPage.fillProjectField({
      fieldName: 'projectMembers[1].email',
      content: 'new-email@gmail.com'
    });

    await proposalFormFieldPage.fillProjectField({ fieldName: 'name', content: 'Updated Project Name' });

    // Assert that the project member values were auto updated
    const projectAfterUpdate2 = await prisma.project.findUniqueOrThrow({
      where: {
        id: project.id
      },
      include: {
        projectMembers: {
          orderBy: [
            {
              teamLead: 'desc'
            },
            {
              createdAt: 'asc'
            }
          ]
        },
        proposals: {
          select: {
            formAnswers: {
              where: {
                type: 'project_profile'
              },
              select: {
                value: true
              }
            }
          }
        }
      }
    });
    const projectProfileFormAnswer = projectAfterUpdate2.proposals[0].formAnswers[0].value;

    expect(projectAfterUpdate2.name).toBe('Updated Project Name');
    expect(projectAfterUpdate2.projectMembers[0].email).toBe('doe@gmail.com');
    expect(projectAfterUpdate2.projectMembers[1].email).toBe('new-email@gmail.com');
    expect(projectProfileFormAnswer).toStrictEqual({
      projectId: project.id,
      selectedMemberIds: [projectAfterUpdate2.projectMembers[1].id]
    });
  });

  test.skip('Publish a structured proposal with a new project, add new project members, update project fields with members', async ({
    proposalPage,
    documentPage,
    proposalFormFieldPage,
    proposalsListPage
  }) => {
    await loginBrowserUser({
      browserPage: proposalsListPage.page,
      userId: spaceAdmin.id
    });

    await proposalsListPage.goToProposals(space.domain);
    await proposalsListPage.waitForProposalsList();
    await proposalsListPage.proposalTemplateSelect.click();

    const projectWalletAddress = randomETHWalletAddress().toLowerCase();

    await proposalPage.getSelectOption(proposalTemplateId).click();
    await proposalPage.waitForNewProposalPage();
    await documentPage.documentTitleInput.fill('Proposal structured template');
    await proposalFormFieldPage.clickProjectOption('new');
    await proposalPage.page.waitForResponse((response) => {
      return response.request().method() === 'PUT' && response.url().endsWith('/form/answers');
    });
    expect(proposalPage.publishNewProposalButton).toBeDisabled();
    await proposalFormFieldPage.fillProjectField({ fieldName: 'name', content: 'Demo Project' });
    await proposalFormFieldPage.fillProjectField({ fieldName: 'walletAddress', content: projectWalletAddress });
    await proposalFormFieldPage.fillProjectField({ fieldName: 'projectMembers[0].name', content: 'John Doe' });
    await proposalFormFieldPage.fillProjectField({ fieldName: 'projectMembers[0].email', content: 'doe@gmail.com' });

    await proposalFormFieldPage.getFormFieldInput(shortTextFieldId, 'short_text').click();
    await proposalFormFieldPage.page.keyboard.type('Short text field');

    // wait or else adding a team member erases the previous updates
    await proposalPage.page.waitForTimeout(100);

    await proposalPage.projectTeamMembersSelect.click();
    // Add a new project member
    await proposalPage.getProjectMemberOption(0).click();
    // Should be disabled since project profile has invalid values
    expect(proposalPage.publishNewProposalButton).toBeDisabled();
    // Remove the project member
    await proposalPage.getRemoveProjectMemberButton(0).click();
    // Should be now enabled
    expect(proposalPage.publishNewProposalButton).toBeEnabled();
    // Add the newly created project member again
    await proposalPage.projectTeamMembersSelect.click();
    await proposalPage.getProjectMemberOption(0).click();
    await proposalPage.page.waitForResponse((response) => {
      return response.request().method() === 'PUT' && response.url().endsWith('/form/answers');
    });
    await proposalFormFieldPage.fillProjectField({ fieldName: 'projectMembers[1].name', content: 'Jane Doe' });
    await proposalFormFieldPage.fillProjectField({ fieldName: 'projectMembers[1].email', content: 'jane@gmail.com' });
    // Click on body to close the dropdown
    await proposalFormFieldPage.page.click('body');

    await proposalPage.publishNewProposalButton.click();
    await proposalPage.page.waitForURL('**/proposal-structured-template*');

    const proposal = await prisma.proposal.findFirstOrThrow({
      where: {
        page: {
          spaceId: space.id,
          path: {
            startsWith: 'proposal-structured-template'
          }
        }
      },
      select: {
        formAnswers: {
          where: {
            type: 'project_profile'
          },
          select: {
            value: true
          }
        },
        id: true,
        project: {
          select: {
            id: true,
            name: true,
            description: true,
            walletAddress: true,
            projectMembers: {
              select: {
                id: true,
                email: true,
                name: true
              }
            }
          }
        }
      }
    });
    const projectProfileFormAnswer = proposal.formAnswers[0].value;
    const createdProject = proposal.project!;
    expect(createdProject.name).toBe('Demo Project');
    expect(createdProject.projectMembers[0].name).toBe('John Doe');
    expect(createdProject.projectMembers[0].email).toBe('doe@gmail.com');
    expect(createdProject.projectMembers[1].name).toBe('Jane Doe');
    expect(createdProject.projectMembers[1].email).toBe('jane@gmail.com');
    expect(createdProject.walletAddress).toBe(projectWalletAddress);
    expect(projectProfileFormAnswer).toStrictEqual({
      projectId: createdProject.id,
      selectedMemberIds: [createdProject.projectMembers[1].id]
    });
  });

  test('Visit an existing proposal as a space member should hide private project fields', async ({
    projectSettings,
    documentPage,
    proposalPage,
    proposalsListPage
  }) => {
    const spaceMember = await generateUser({
      space: { id: space.id }
    });
    await loginBrowserUser({
      browserPage: proposalsListPage.page,
      userId: spaceMember.id
    });

    await proposalsListPage.goToProposals(space.domain);
    await proposalsListPage.waitForProposalsList();

    const proposal = await prisma.proposal.findFirstOrThrow({
      where: {
        spaceId: space.id,
        projectId: project.id
      },
      select: {
        page: {
          select: {
            path: true
          }
        }
      }
    });

    const proposalPath = proposal.page!.path;
    await documentPage.goToPage({
      domain: space.domain,
      path: proposalPath
    });

    await proposalPage.page.waitForURL(`**/${proposalPath}`);

    await expect(projectSettings.getProjectField({ fieldName: 'name' })).toHaveText('Updated Project Name');

    await expect(
      projectSettings.getProjectField({
        fieldName: 'projectMembers[0].email'
      })
    ).toBeHidden();
  });
});
