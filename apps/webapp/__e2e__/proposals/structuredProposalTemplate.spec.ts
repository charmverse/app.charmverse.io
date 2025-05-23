import type { FormFieldType, Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { ProposalWorkflowTyped } from '@charmverse/core/proposals';
import { testUtilsUser } from '@charmverse/core/test';
import {
  getDefaultEvaluation,
  getDefaultFeedbackEvaluation
} from '@packages/lib/proposals/workflows/defaultEvaluation';
import { defaultWorkflowTitle } from '@packages/lib/proposals/workflows/defaultWorkflows';
import { expect, test } from '__e2e__/testWithFixtures';
import { v4 as uuid } from 'uuid';

import { loginBrowserUser } from '../utils/mocks';

let space: Space;
let spaceAdmin: User;
let spaceMember: User;
let defaultWorkflows: ProposalWorkflowTyped[];

type TestedFormFieldTypes = Exclude<FormFieldType, 'select' | 'multiselect' | 'person' | 'image' | 'file'>;

// Skip testing some types to save time
const testedFormFieldTypes: TestedFormFieldTypes[] = [
  // This ordering is very important for test integrity. Don't change it
  'short_text',
  // 'long_text', // Having issues selecting charmeditor for testing. Leaving this out for now
  'number',
  'phone',
  'url',
  'email',
  // 'select',
  // 'multiselect',
  'wallet',
  // 'date', // We need to select the date input. Omitting for now
  // 'person',
  'label'
  // 'image',
  // 'file'
];

const testValues: Record<TestedFormFieldTypes, string> = {
  short_text: 'Short text',
  long_text: 'Long text',
  number: '123',
  phone: '+1234567890',
  url: 'https://charmverse.com',
  email: 'test@charmverse.io',
  wallet: '0x888888CfAebbEd5554c3F36BfBD233f822e9455f',
  date: '2022-12-31',
  label: 'Label',
  project_profile: 'Project profile',
  milestone: 'Milestone',
  optimism_project_profile: 'Op project'
};

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

  // Set to an exact workflow so selectors always work
  defaultWorkflows = [
    {
      id: uuid(),
      createdAt: new Date(),
      title: defaultWorkflowTitle,
      privateEvaluations: false,
      evaluations: [
        getDefaultFeedbackEvaluation(),
        getDefaultEvaluation({
          title: 'Review',
          type: 'pass_fail'
        }),
        getDefaultEvaluation({
          title: 'Community vote',
          type: 'vote'
        })
      ],
      index: 0,
      spaceId: space.id,
      draftReminder: false
    }
  ];
  await prisma.proposalWorkflow.createMany({
    data: defaultWorkflows
  });
});

test.describe.serial('Structured proposal template', () => {
  test('User creates a structured proposal template with required, non-required and private fields', async ({
    databasePage,
    proposalPage,
    proposalListPage,
    documentPage,
    proposalFormFieldPage,
    page
  }) => {
    await loginBrowserUser({
      browserPage: proposalListPage.page,
      userId: spaceAdmin.id
    });
    // Initial test setup
    await proposalListPage.goToHomePage();

    await proposalListPage.getSidebarLink('proposals').click();

    await proposalListPage.waitForProposalsList();

    await proposalListPage.proposalTemplateSelect.click();

    await databasePage.getNewTemplateButton().click();

    await proposalListPage.structuredProposalTemplateMenu.click();

    await proposalPage.waitForNewProposalPage();

    await expect(documentPage.charmEditor).not.toBeVisible();

    await expect(proposalFormFieldPage.addNewFormFieldButton).toBeVisible();

    await expect(proposalPage.publishNewProposalButton).toBeDisabled();

    // Set the title
    await documentPage.documentTitleInput.fill('Structured proposal template');

    // Start from a fresh state
    await proposalFormFieldPage.fieldMoreOptions.click();
    await proposalFormFieldPage.deleteField.click();

    await expect(proposalFormFieldPage.fieldMoreOptions).not.toBeVisible();

    // Start configuring the form fields
    for (let i = 0; i < testedFormFieldTypes.length; i++) {
      const fieldType = testedFormFieldTypes[i];
      await proposalFormFieldPage.addNewFormFieldButton.click();
      await proposalFormFieldPage.selectFormFieldType({ index: i, fieldType });
      await proposalFormFieldPage.getFormFieldNameInput(i).fill(fieldType);

      await expect(proposalFormFieldPage.fieldMoreOptions.nth(i)).toBeVisible();

      if (i === 0) {
        // Make first field private and leave default required
        await proposalFormFieldPage.formFieldPrivateSwitch.nth(i).click();
      } else if (i === 1) {
        // Make second field private but not required
        await proposalFormFieldPage.formFieldPrivateSwitch.nth(i).click();
        await proposalFormFieldPage.formFieldRequiredSwitch.nth(i).click();
      } else if (i === 2) {
        // Leave third field required and don't untick required option
      } else if (fieldType !== 'label') {
        // Make other fields optional
        await proposalFormFieldPage.formFieldRequiredSwitch.nth(i).click();
      }
    }

    // Change focus
    await proposalPage.evaluationSettingsSidebar.click();

    await proposalPage.selectEvaluationReviewer('pass_fail', spaceAdmin.id);
    await proposalPage.selectEvaluationReviewer('vote', 'space_member');

    const publishResponse = proposalPage.page.waitForResponse('**/publish');
    await proposalPage.publishNewProposalButton.click();
    await publishResponse;
  });

  test('Visit structured proposal template and edit/add fields', async ({
    databasePage,
    proposalPage,
    proposalListPage,
    documentPage,
    proposalFormFieldPage,
    page
  }) => {
    await loginBrowserUser({
      browserPage: proposalListPage.page,
      userId: spaceAdmin.id
    });

    const proposalTemplate = await prisma.proposal.findFirstOrThrow({
      where: {
        spaceId: space.id
      },
      select: {
        page: {
          select: {
            id: true,
            path: true
          }
        }
      }
    });

    await proposalListPage.goToProposals(space.domain);

    await proposalListPage.waitForProposalsList();

    await proposalListPage.proposalTemplateSelect.click();

    await databasePage.getTemplateMenu({ pageId: proposalTemplate.page!.id }).click();

    await databasePage.getTemplateMenuEditOption({ pageId: proposalTemplate.page!.id }).click();

    await documentPage.waitForDocumentPage({
      domain: space.domain,
      path: proposalTemplate.page!.path
    });

    // Add a field
    await proposalFormFieldPage.addNewFormFieldButton.click();

    // Index selector uses 0-based index. We use length of the testedFormFieldTypes array as it represents 0 - n + 1 added field
    await expect(proposalFormFieldPage.toggleFormFieldButton.nth(testedFormFieldTypes.length)).toBeVisible();

    // Field will be autoexpanded since this form already exists
    await proposalFormFieldPage.getFormFieldNameInput(0).fill('New field');

    await proposalPage.page.waitForTimeout(500);

    await proposalPage.page.reload();

    // Click edit on new field after reloading
    await proposalFormFieldPage.toggleFormFieldButton.nth(testedFormFieldTypes.length).click();

    // Delete this new additional field
    await proposalFormFieldPage.fieldMoreOptions.click();

    await proposalFormFieldPage.deleteField.click();

    await proposalPage.page.waitForTimeout(500);

    await proposalPage.page.reload();

    // Make sure the field was deleted
    await expect(proposalFormFieldPage.toggleFormFieldButton.nth(testedFormFieldTypes.length)).not.toBeVisible();
  });

  test('Create proposal from structure template after providing required fields', async ({
    proposalPage,
    proposalListPage,
    documentPage,
    page,
    proposalFormFieldPage
  }) => {
    await loginBrowserUser({
      browserPage: proposalListPage.page,
      userId: spaceAdmin.id
    });

    const proposalTemplate = await prisma.proposal.findFirstOrThrow({
      where: {
        spaceId: space.id
      },
      select: {
        page: {
          select: {
            id: true,
            path: true
          }
        },
        form: {
          select: {
            formFields: {
              select: {
                type: true,
                id: true
              },
              orderBy: {
                index: 'asc'
              }
            }
          }
        }
      }
    });

    const formFields = proposalTemplate.form!.formFields;

    await proposalListPage.goToProposals(space.domain);

    await proposalListPage.waitForProposalsList();

    await proposalListPage.proposalTemplateSelect.click();

    await proposalPage.getSelectOption(proposalTemplate.page!.id).click();

    await proposalPage.waitForNewProposalPage();

    // Should be disabled as the required fields are not filled
    await expect(proposalPage.publishNewProposalButton).toBeDisabled();

    await documentPage.documentTitleInput.fill('Proposal from structured template');

    const apiResponse = proposalPage.page.waitForResponse('**/form/answers');
    for (let i = 0; i < formFields.length; i++) {
      const field = formFields[i];

      // Labels are readonly and act as sections inside the test
      if (field.type !== 'label') {
        await proposalFormFieldPage.getFormFieldInput(field.id, field.type).click();

        // Give time to focus the field
        await page.waitForTimeout(100);

        await page.keyboard.type(testValues[field.type as TestedFormFieldTypes]);
      }
    }

    await apiResponse;
  });

  test.fixme(
    'Visit structured proposal and edit form field answers as an author',
    async ({ proposalPage, proposalListPage, documentPage, proposalFormFieldPage, page }) => {
      await loginBrowserUser({
        browserPage: proposalListPage.page,
        userId: spaceAdmin.id
      });

      const proposal = await prisma.proposal.findFirstOrThrow({
        where: {
          spaceId: space.id,
          page: {
            type: 'proposal'
          }
        },
        select: {
          id: true,
          page: {
            select: {
              id: true,
              path: true
            }
          },
          form: {
            select: {
              formFields: {
                select: {
                  id: true,
                  type: true
                },
                orderBy: {
                  index: 'asc'
                }
              }
            }
          }
        }
      });

      const formFields = proposal.form!.formFields;

      const shortTextField = formFields.find((field) => field.type === 'short_text')!;

      await documentPage.goToPage({
        domain: space.domain,
        path: proposal.page!.path
      });

      const valueToSet = 'John Doe';

      await expect(proposalFormFieldPage.getFormFieldInput(shortTextField.id, 'short_text')).toBeVisible();

      // Give some time for value to populate
      await page.waitForTimeout(200);

      const input = proposalFormFieldPage.getFormFieldInput(shortTextField.id, 'short_text');

      await input.clear();
      await expect(input).toHaveValue('');
      await input.fill(valueToSet);
      await expect(input).toHaveValue(valueToSet);

      // Leave some time for the changes to be saved
      await page.waitForTimeout(200);

      await Promise.all([
        page.waitForResponse('**/api/proposals/**/publish'),
        proposalPage.publishNewProposalButton.click()
      ]);

      await proposalPage.page.reload();

      // Reload the page to ensure the changes were saved
      await expect(proposalFormFieldPage.getFormFieldInput(shortTextField.id, 'short_text')).toHaveValue(valueToSet);
    }
  );

  test.fixme(
    'Visit structured proposal and view only public form fields as a space member',
    async ({ proposalListPage, documentPage, proposalFormFieldPage }) => {
      await loginBrowserUser({
        browserPage: proposalListPage.page,
        userId: spaceMember.id
      });

      const proposal = await prisma.proposal.findFirstOrThrow({
        where: {
          spaceId: space.id,
          page: {
            type: 'proposal'
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

      await documentPage.goToPage({
        domain: space.domain,
        path: proposal.page!.path
      });

      await expect(
        proposalFormFieldPage.page.locator('data-test=field-label').filter({ hasText: 'email' })
      ).toBeVisible();
      await expect(
        proposalFormFieldPage.page.locator('data-test=field-label').filter({ hasText: 'phone' })
      ).toBeVisible();
      await expect(
        proposalFormFieldPage.page.locator('data-test=field-label').filter({ hasText: 'short_text' })
      ).not.toBeVisible();
      await expect(
        proposalFormFieldPage.page.locator('data-test=field-label').filter({ hasText: 'long_text' })
      ).not.toBeVisible();
    }
  );
});
