import { prisma } from '@charmverse/core/prisma-client';
import { test as base, expect } from '@playwright/test';
import { DocumentPage } from '__e2e__/po/document.po';
import { loginBrowserUser } from '__e2e__/utils/mocks';
import { generatePage } from '__e2e__/utils/pages';

import type { PageContent } from 'lib/prosemirror/interfaces';
import { builders } from 'testing/prosemirror/builders';
import { generateUserAndSpace } from 'testing/setupDatabase';

type Fixtures = {
  documentPage: DocumentPage;
};

const test = base.extend<Fixtures>({
  documentPage: async ({ page }, use) => use(new DocumentPage(page))
});

test('Drag and drop one paragraph over another in the CharmEditor', async ({ documentPage }) => {
  const { space, user } = await generateUserAndSpace({ isAdmin: true });
  const generatedPage = await generatePage({ spaceId: space.id, createdBy: user.id });

  await prisma.page.update({
    where: {
      id: generatedPage.id
    },
    data: {
      content: builders.doc(builders.p('Item 1'), builders.p('Item 2')).toJSON()
    }
  });

  await loginBrowserUser({
    browserPage: documentPage.page,
    userId: user.id
  });

  await documentPage.goToPage({
    domain: space.domain,
    path: generatedPage.path
  });

  await expect(documentPage.charmEditor).toBeVisible();

  const paragraph1Locator = documentPage.page.locator('.bangle-editor-core p:nth-child(1)');
  const paragraph2Locator = documentPage.page.locator('.bangle-editor-core p:nth-child(2)');
  await paragraph2Locator.hover();

  const rowActionsHandleLocator = documentPage.page.locator('.bangle-editor-core .charm-drag-handle');
  await expect(rowActionsHandleLocator).toBeVisible();
  await rowActionsHandleLocator.dragTo(paragraph1Locator, {
    force: true,
    targetPosition: {
      x: 0,
      y: 0
    },
    sourcePosition: {
      x: 0,
      y: 0
    }
  });

  const page = await prisma.page.findUniqueOrThrow({
    where: {
      id: generatedPage.id
    },
    select: {
      content: true
    }
  });

  const pageContent = page.content as PageContent;

  expect(pageContent).toMatchObject(builders.doc(builders.p('Item 2'), builders.p('Item 1')).toJSON());
});
