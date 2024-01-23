import type { Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { ProposalWorkflowTyped } from '@charmverse/core/proposals';
import { testUtilsUser } from '@charmverse/core/test';
import { test as base, expect } from '@playwright/test';
import { DatabasePage } from '__e2e__/po/databasePage.po';
import { DocumentPage } from '__e2e__/po/document.po';
import { FormField } from '__e2e__/po/formField.po';
import { ProposalPage } from '__e2e__/po/proposalPage.po';
import { ProposalsListPage } from '__e2e__/po/proposalsList.po';
import { v4 } from 'uuid';

import { getDefaultWorkflows } from 'lib/proposal/workflows/defaultWorkflows';

import { loginBrowserUser } from '../utils/mocks';

type Fixtures = {
  proposalListPage: ProposalsListPage;
  documentPage: DocumentPage;
  databasePage: DatabasePage;
  proposalPage: ProposalPage;
  formField: FormField;
};

const test = base.extend<Fixtures>({
  proposalListPage: ({ page }, use) => use(new ProposalsListPage(page)),
  documentPage: ({ page }, use) => use(new DocumentPage(page)),
  databasePage: ({ page }, use) => use(new DatabasePage(page)),
  proposalPage: ({ page }, use) => use(new ProposalPage(page)),
  formField: ({ page }, use) => use(new FormField(page))
});

let space: Space;
let spaceAdmin: User;
let spaceMember: User;
let defaultWorkflows: ProposalWorkflowTyped[];

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
  test('User creates a structured proposal template with required and non-required fields', async ({
    databasePage,
    proposalPage,
    proposalListPage,
    documentPage,
    formField
  }) => {
    await loginBrowserUser({
      browserPage: proposalListPage.page,
      userId: spaceAdmin.id
    });
    await proposalListPage.goToHomePage();

    await proposalListPage.getSidebarLink('proposals').click();

    await proposalListPage.waitForProposalsList();

    await proposalListPage.proposalTemplateSelect.click();

    await databasePage.getNewTemplateButton().click();

    await proposalListPage.structuredProposalTemplateMenu.click();

    await proposalPage.waitForNewProposalPage(space.domain);

    await expect(documentPage.charmEditor).not.toBeVisible();

    await expect(formField.addNewFormFieldButton).toBeVisible();

    await expect(proposalPage.saveDraftButton).toBeDisabled();

    await formField.getFormFieldNameInput().fill('Name');

    await formField.addNewFormFieldButton.click();

    await documentPage.documentTitle.getByPlaceholder('Title (required)').fill('Structured proposal template');

    await formField.getFormFieldNameInput(1).fill('Nickname');

    await formField.formFieldRequiredSwitch.nth(1).click();

    await formField.formFieldPrivateSwitch.nth(1).click();

    await proposalPage.selectEvaluationReviewer('pass_fail', spaceAdmin.id);
    await proposalPage.selectEvaluationReviewer('vote', 'space_member');

    proposalPage.saveDraftButton.click();
    await proposalPage.page.waitForResponse(/\/api\/proposals/);
  });

  test('Visit structured proposal template and edit/add fields', async ({
    databasePage,
    proposalPage,
    proposalListPage,
    documentPage,
    formField
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

    await expect(formField.addNewFormFieldButton).toBeVisible();

    // Should be disabled as there are no changes
    await expect(formField.formFieldsSaveButton).toBeDisabled();

    await formField.toggleFormFieldButton.nth(0).click();

    // Rename first field
    await formField.getFormFieldNameInput().fill('Full name');

    await expect(formField.formFieldsSaveButton).toBeEnabled();

    await formField.addNewFormFieldButton.click();

    await formField.getFormFieldNameInput(1).fill('Surname');

    await formField.formFieldsSaveButton.click();

    await proposalPage.page.waitForTimeout(500);

    await proposalPage.page.reload();

    // Reload the page to ensure the changes were saved
    await expect(proposalPage.page.locator('data-test=field-label').filter({ hasText: /^Full name\*$/ })).toBeVisible();
  });

  test('Create proposal from structure template after providing required fields', async ({
    proposalPage,
    proposalListPage,
    documentPage,
    formField
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

    await proposalListPage.goToProposals(space.domain);

    await proposalListPage.waitForProposalsList();

    await proposalListPage.proposalTemplateSelect.click();

    await proposalPage.getSelectOption(proposalTemplate.page!.id).click();

    await proposalPage.waitForNewProposalPage(space.domain);

    // Should be disabled as the required fields are not filled
    await expect(proposalPage.saveDraftButton).toBeDisabled();

    await documentPage.documentTitle.getByPlaceholder('Title (required)').fill('Proposal 1');

    await formField.getFormFieldInput(formFieldIds[0]).fill('John');
    await formField.getFormFieldInput(formFieldIds[2]).fill('Doe');

    proposalPage.saveDraftButton.click();

    await proposalPage.page.waitForResponse(/\/api\/proposals/);
  });

  test('Visit structured proposal and edit form field answers as an author', async ({
    proposalPage,
    proposalListPage,
    documentPage,
    formField
  }) => {
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

    await formField.getFormFieldInput(formFieldIds[1]).fill('John Doe');

    await proposalPage.completeDraftButton.click();

    await proposalPage.page.waitForTimeout(500);

    await proposalPage.page.reload();

    // Reload the page to ensure the changes were saved
    await expect(formField.getFormFieldInput(formFieldIds[1])).toHaveValue('John Doe');
  });

  test('Visit structured proposal and view only public form fields as a space member', async ({
    proposalListPage,
    documentPage,
    formField
  }) => {
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

    await expect(formField.page.locator('data-test=field-label').filter({ hasText: 'Full name' })).toBeVisible();
    await expect(formField.page.locator('data-test=field-label').filter({ hasText: 'Surname' })).toBeVisible();
    await expect(formField.page.locator('data-test=field-label').filter({ hasText: 'Nickname' })).not.toBeVisible();
  });
});
