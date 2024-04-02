import { prisma } from '@charmverse/core/prisma-client';
import type { Project, Space, User } from '@charmverse/core/prisma-client';
import type { ProposalWorkflowTyped } from '@charmverse/core/proposals';
import { testUtilsUser } from '@charmverse/core/test';
import { expect, test } from '__e2e__/testWithFixtures';
import { loginBrowserUser } from '__e2e__/utils/mocks';
import { v4 } from 'uuid';

import { defaultProjectValues } from 'lib/projects/constants';
import { createProject } from 'lib/projects/createProject';
import { getDefaultFeedbackEvaluation } from 'lib/proposals/workflows/defaultEvaluation';
import { defaultWorkflowTitle } from 'lib/proposals/workflows/defaultWorkflows';
import { randomETHWalletAddress } from 'lib/utils/blockchain';

let space: Space;
let spaceAdmin: User;
let spaceMember: User;
let defaultWorkflows: ProposalWorkflowTyped[];
let project: Project;
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

  spaceAdmin = await testUtilsUser.generateSpaceUser({
    spaceId: space.id,
    isAdmin: true
  });

  spaceMember = await testUtilsUser.generateSpaceUser({
    spaceId: space.id,
    isAdmin: false
  });

  await Promise.all([spaceAdmin.id]);

  await prisma.spaceRole.updateMany({
    where: {
      OR: [
        {
          userId: spaceAdmin.id,
          spaceId: space.id
        },
        {
          userId: spaceMember.id,
          spaceId: space.id
        }
      ]
    },
    data: {
      onboarded: true
    }
  });

  // Set to an exact workflow so selectors always work
  defaultWorkflows = [
    {
      id: v4(),
      createdAt: new Date(),
      title: defaultWorkflowTitle,
      evaluations: [getDefaultFeedbackEvaluation()],
      index: 0,
      spaceId: space.id
    }
  ];

  project = await createProject({
    project: {
      ...defaultProjectValues,
      name: 'Test Project',
      projectMembers: [
        {
          ...defaultProjectValues.projectMembers[0],
          email: `test@${v4()}.com`,
          name: 'Test Member'
        }
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

    await proposalPage.waitForNewProposalPage(space.domain);

    await documentPage.documentTitle.getByPlaceholder('Title (required)').fill('Structured proposal template');

    await proposalFormFieldPage.toggleProjectFieldConfig({
      fieldName: 'project-excerpt',
      required: false
    });

    await proposalFormFieldPage.toggleProjectFieldConfig({
      fieldName: 'project-walletAddress',
      private: false
    });

    for (const field of [
      'description',
      'website',
      'twitter',
      'github',
      'blog',
      'demoUrl',
      'communityUrl',
      'otherUrl'
    ]) {
      await proposalFormFieldPage.toggleProjectFieldConfig({
        fieldName: `project-${field}`,
        hidden: true
      });

      await proposalFormFieldPage.page.waitForTimeout(50);
    }

    for (const field of [
      'telegram',
      'twitter',
      'linkedin',
      'otherUrl',
      'walletAddress',
      'warpcast',
      'github',
      'previousProjects'
    ]) {
      await proposalFormFieldPage.toggleProjectFieldConfig({
        fieldName: `project-member-${field}`,
        hidden: true
      });

      await proposalFormFieldPage.page.waitForTimeout(50);
    }

    await proposalFormFieldPage.page.waitForTimeout(150);

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

    expect(await proposalFormFieldPage.getProjectFieldLabel('name')).toBe('Project Name*');
    expect(await proposalFormFieldPage.getProjectFieldLabel('excerpt')).toBe('Describe your project in one sentence');
    expect(await proposalFormFieldPage.getProjectFieldLabel('member-name')).toBe('Name*');
    expect(await proposalFormFieldPage.getProjectFieldLabel('member-email')).toBe('Email*');
    expect(await proposalPage.page.locator('data-test=project-member-walletAddress-field-container').count()).toBe(0);

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

  test('Create a structured proposal with project & project members and update project fields', async ({
    proposalPage,
    documentPage,
    proposalFormFieldPage,
    proposalsListPage,
    projectSettings
  }) => {
    await loginBrowserUser({
      browserPage: proposalsListPage.page,
      userId: spaceAdmin.id
    });

    await proposalsListPage.goToProposals(space.domain);
    await proposalsListPage.waitForProposalsList();
    await proposalsListPage.proposalTemplateSelect.click();

    await proposalPage.getSelectOption(proposalTemplateId).click();
    await proposalPage.waitForNewProposalPage(space.domain);
    await documentPage.documentTitleInput.fill('Proposal from structured template');
    // Disabled since no project is selected
    expect(proposalPage.publishNewProposalButton).toBeDisabled();
    await proposalFormFieldPage.clickProjectOption(project.id);
    await projectSettings.fillProjectField({ fieldName: 'walletAddress', content: randomETHWalletAddress() });
    await projectSettings.fillProjectField({ fieldName: 'excerpt', content: 'This is my project', textArea: true });
    // Type invalid email
    await projectSettings.fillProjectField({ fieldName: 'projectMembers[0].email', content: 'john' });
    // Disabled since project profile has invalid values
    expect(proposalPage.publishNewProposalButton).toBeDisabled();
    await projectSettings.fillProjectField({ fieldName: 'projectMembers[0].email', content: 'john@gmail.com' });
    await proposalFormFieldPage.getFormFieldInput(shortTextFieldId, 'short_text').click();
    await proposalFormFieldPage.page.keyboard.type('Short text field');
    await proposalPage.publishNewProposalButton.click();
    await proposalPage.page.waitForURL('**/proposal-from-structured-template*');

    const projectAfterUpdate1 = await prisma.project.findUniqueOrThrow({
      where: {
        id: project.id
      },
      select: {
        excerpt: true,
        projectMembers: {
          select: {
            email: true
          }
        }
      }
    });
    expect(projectAfterUpdate1.excerpt).toBe('This is my project');
    expect(projectAfterUpdate1.projectMembers[0].email).toBe('john@gmail.com');

    await projectSettings.fillProjectField({ fieldName: 'projectMembers[0].email', content: 'doe@gmail.com' });
    await projectSettings.fillProjectField({ fieldName: 'name', content: 'Updated Project Name' });
    await projectSettings.page.waitForTimeout(500);

    // Assert that the project member values were auto updated
    const projectAfterUpdate2 = await prisma.project.findUniqueOrThrow({
      where: {
        id: project.id
      },
      select: {
        name: true,
        projectMembers: {
          select: {
            email: true
          }
        }
      }
    });

    expect(projectAfterUpdate2.name).toBe('Updated Project Name');
    expect(projectAfterUpdate2.projectMembers[0].email).toBe('doe@gmail.com');
  });

  test('Create a structured proposal with a new project and update project fields', async ({
    proposalPage,
    documentPage,
    proposalFormFieldPage,
    proposalsListPage,
    projectSettings
  }) => {
    await loginBrowserUser({
      browserPage: proposalsListPage.page,
      userId: spaceAdmin.id
    });

    await proposalsListPage.goToProposals(space.domain);
    await proposalsListPage.waitForProposalsList();
    await proposalsListPage.proposalTemplateSelect.click();

    const projectWalletAddress = randomETHWalletAddress();

    await proposalPage.getSelectOption(proposalTemplateId).click();
    await proposalPage.waitForNewProposalPage(space.domain);
    await documentPage.documentTitleInput.fill('Proposal structured template');
    await proposalFormFieldPage.clickProjectOption('new');
    expect(proposalPage.publishNewProposalButton).toBeDisabled();
    await projectSettings.fillProjectField({ fieldName: 'name', content: 'Demo Project' });
    await projectSettings.fillProjectField({ fieldName: 'walletAddress', content: projectWalletAddress });
    await projectSettings.fillProjectField({ fieldName: 'projectMembers[0].name', content: 'John Doe' });
    await projectSettings.fillProjectField({ fieldName: 'projectMembers[0].email', content: 'doe@gmail.com' });
    await projectSettings.addProjectMemberButton.click();
    await projectSettings.fillProjectField({ fieldName: 'projectMembers[1].name', content: 'Jane Doe' });
    await projectSettings.fillProjectField({ fieldName: 'projectMembers[1].email', content: 'jane@gmail.com' });
    await proposalFormFieldPage.getFormFieldInput(shortTextFieldId, 'short_text').click();
    await proposalFormFieldPage.page.keyboard.type('Short text field');
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
        project: {
          select: {
            id: true,
            name: true,
            excerpt: true,
            walletAddress: true,
            projectMembers: {
              select: {
                email: true,
                name: true
              }
            }
          }
        }
      }
    });
    const createdProject = proposal.project!;
    expect(createdProject.name).toBe('Demo Project');
    expect(createdProject.projectMembers[0].name).toBe('John Doe');
    expect(createdProject.projectMembers[0].email).toBe('doe@gmail.com');
    expect(createdProject.projectMembers[1].name).toBe('Jane Doe');
    expect(createdProject.projectMembers[1].email).toBe('jane@gmail.com');
    expect(createdProject.walletAddress).toBe(projectWalletAddress.toLowerCase());

    await projectSettings.fillProjectField({ fieldName: 'excerpt', content: 'This is my project', textArea: true });

    await projectSettings.page.waitForTimeout(500);

    const projectAfterUpdate2 = await prisma.project.findUniqueOrThrow({
      where: {
        id: createdProject.id
      },
      select: {
        excerpt: true
      }
    });

    expect(projectAfterUpdate2.excerpt).toBe('This is my project');
  });

  test('Visit an existing proposal as a space member should hide private project fields', async ({
    projectSettings,
    documentPage,
    proposalPage,
    proposalsListPage
  }) => {
    await loginBrowserUser({
      browserPage: proposalsListPage.page,
      userId: spaceMember.id
    });

    await proposalsListPage.goToProposals(space.domain);
    await proposalsListPage.waitForProposalsList();

    const proposal = await prisma.proposal.findFirstOrThrow({
      where: {
        spaceId: space.id,
        page: {
          type: 'proposal',
          path: {
            startsWith: 'proposal-from-structured-template'
          }
        }
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

    // Wallet address was manually made public so it should be visible
    expect(
      (await projectSettings
        .getProjectField({
          fieldName: 'walletAddress'
        })
        .inputValue()) !== ''
    ).toBeTruthy();

    expect(
      (await projectSettings
        .getProjectField({
          fieldName: 'projectMembers[0].email'
        })
        .inputValue()) === ''
    ).toBeTruthy();
  });
});
