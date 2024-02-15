import type { FormFieldType, Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { ProposalWorkflowTyped } from '@charmverse/core/proposals';
import { testUtilsUser } from '@charmverse/core/test';
import { expect, test } from '__e2e__/testWithFixtures';
import { v4 } from 'uuid';

import { getDefaultWorkflows } from 'lib/proposal/workflows/defaultWorkflows';

import { loginBrowserUser } from '../utils/mocks';

let space: Space;
let spaceAdmin: User;
let spaceMember: User;
let defaultWorkflows: ProposalWorkflowTyped[];

type TestedFormFieldTypes = Exclude<FormFieldType, 'select' | 'multiselect' | 'person' | 'image' | 'file'>;

// Skip testing some types to save time
const testedFormFieldTypes: TestedFormFieldTypes[] = [
  'short_text',
  'long_text',
  'number',
  'phone',
  'url',
  'email',
  // 'select',
  // 'multiselect',
  'wallet',
  'date',
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
  label: 'Label'
};

test.beforeAll(async () => {
  // Initial setup
  const generated = await testUtilsUser.generateUserAndSpace({
    isAdmin: true,
    spaceName: 'space',
    onboarded: true,
    domain: `cvt-${v4()}`
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

  defaultWorkflows = getDefaultWorkflows(space.id);
  await prisma.proposalWorkflow.createMany({
    data: defaultWorkflows
  });
});

test.describe.serial('Structured proposal template', () => {
  test('User creates a structured proposal template with required, non-required and private fields', async ({
    databasePage,
    proposalPage,
    proposalsListPage,
    documentPage,
    proposalFormFieldPage,
    page
  }) => {
    await loginBrowserUser({
      browserPage: proposalsListPage.page,
      userId: spaceAdmin.id
    });
    // Initial test setup
    await proposalsListPage.goToHomePage();

    await proposalsListPage.getSidebarLink('proposals').click();

    await proposalsListPage.waitForProposalsList();

    await proposalsListPage.proposalTemplateSelect.click();

    await databasePage.getNewTemplateButton().click();

    await proposalsListPage.structuredProposalTemplateMenu.click();

    await proposalPage.waitForNewProposalPage(space.domain);

    await expect(documentPage.charmEditor).not.toBeVisible();

    await expect(proposalFormFieldPage.addNewFormFieldButton).toBeVisible();

    await expect(proposalPage.saveDraftButton).toBeDisabled();

    // Set the title
    await documentPage.documentTitle.getByPlaceholder('Title (required)').fill('Structured proposal template');

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

    await proposalPage.selectEvaluationReviewer('pass_fail', spaceAdmin.id);
    await proposalPage.selectEvaluationReviewer('vote', 'space_member');

    proposalPage.saveDraftButton.click();
    await proposalPage.page.waitForResponse(/\/api\/proposals/);
  });

  test('Visit structured proposal template and edit/add fields', async ({
    databasePage,
    proposalPage,
    proposalsListPage,
    documentPage,
    proposalFormFieldPage
  }) => {
    await loginBrowserUser({
      browserPage: proposalsListPage.page,
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

    await proposalsListPage.goToProposals(space.domain);

    await proposalsListPage.waitForProposalsList();

    await proposalsListPage.proposalTemplateSelect.click();

    await databasePage.getTemplateMenu({ pageId: proposalTemplate.page!.id }).click();

    await databasePage.getTemplateMenuEditOption({ pageId: proposalTemplate.page!.id }).click();

    await documentPage.waitForDocumentPage({
      domain: space.domain,
      path: proposalTemplate.page!.path
    });

    // Add a field
    await proposalFormFieldPage.addNewFormFieldButton.click();

    await expect(proposalFormFieldPage.fieldMoreOptions.nth(testedFormFieldTypes.length + 1)).toBeVisible();

    await proposalPage.page.waitForTimeout(500);

    await proposalPage.page.reload();

    // Expect new field to be visible after reloading
    await expect(proposalFormFieldPage.fieldMoreOptions.nth(testedFormFieldTypes.length + 1)).toBeVisible();

    // Delete this new additional field
    await proposalFormFieldPage.fieldMoreOptions.nth(testedFormFieldTypes.length + 1).click();
    await proposalFormFieldPage.deleteField.click();

    await proposalPage.page.waitForTimeout(500);

    await proposalPage.page.reload();

    // Make sure the field was deleted
    await expect(proposalFormFieldPage.fieldMoreOptions.nth(testedFormFieldTypes.length + 1)).not.toBeVisible();
  });

  test('Create proposal from structure template after providing required fields', async ({
    proposalPage,
    proposalsListPage,
    documentPage,
    page,
    proposalFormFieldPage
  }) => {
    await loginBrowserUser({
      browserPage: proposalsListPage.page,
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

    const formFieldIds = proposalTemplate.form!.formFields.map((_formField) => _formField.id);

    await proposalsListPage.goToProposals(space.domain);

    await proposalsListPage.waitForProposalsList();

    await proposalsListPage.proposalTemplateSelect.click();

    await proposalPage.getSelectOption(proposalTemplate.page!.id).click();

    await proposalPage.waitForNewProposalPage(space.domain);

    // Should be disabled as the required fields are not filled
    await expect(proposalPage.saveDraftButton).toBeDisabled();

    for (let i = 0; i < testedFormFieldTypes.length; i++) {
      const fieldType = testedFormFieldTypes[i];
      await proposalFormFieldPage.getFormFieldInput(formFieldIds[i]).fill(testValues[fieldType]);
    }

    proposalPage.saveDraftButton.click();

    await proposalPage.page.waitForResponse(/\/api\/proposals/);
  });

  test('Visit structured proposal and edit form field answers as an author', async ({
    proposalPage,
    proposalsListPage,
    documentPage,
    proposalFormFieldPage
  }) => {
    await loginBrowserUser({
      browserPage: proposalsListPage.page,
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

    const formFieldIds = proposal.form!.formFields.map((_formField) => _formField.id);

    await documentPage.goToPage({
      domain: space.domain,
      path: proposal.page!.path
    });

    await proposalFormFieldPage.getFormFieldInput(formFieldIds[1]).fill('John Doe');

    await proposalPage.completeDraftButton.click();

    await proposalPage.page.waitForTimeout(500);

    await proposalPage.page.reload();

    // Reload the page to ensure the changes were saved
    await expect(proposalFormFieldPage.getFormFieldInput(formFieldIds[1])).toHaveValue('John Doe');
  });

  test('Visit structured proposal and view only public form fields as a space member', async ({
    proposalsListPage,
    documentPage,
    proposalFormFieldPage
  }) => {
    await loginBrowserUser({
      browserPage: proposalsListPage.page,
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
      proposalFormFieldPage.page.locator('data-test=field-label').filter({ hasText: 'Full name' })
    ).toBeVisible();
    await expect(
      proposalFormFieldPage.page.locator('data-test=field-label').filter({ hasText: 'Surname' })
    ).toBeVisible();
    await expect(
      proposalFormFieldPage.page.locator('data-test=field-label').filter({ hasText: 'Nickname' })
    ).not.toBeVisible();
  });
});
