import { prisma } from '@charmverse/core/prisma-client';
import { generateUserAndSpace } from '@packages/testing/setupDatabase';
import { test as base, expect } from '@playwright/test';
import { DocumentPage } from '__e2e__/po/document.po';
import { loginBrowserUser } from '__e2e__/utils/mocks';
import { generatePage } from '__e2e__/utils/pages';

import type { PageContent } from 'lib/prosemirror/interfaces';

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
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            attrs: { track: [] },
            content: [
              {
                text: 'Item 1',
                type: 'text'
              }
            ]
          },
          {
            type: 'paragraph',
            attrs: { track: [] },
            content: [
              {
                text: 'Item 2',
                type: 'text'
              }
            ]
          }
        ]
      }
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
  await documentPage.page.waitForFunction(
    () => document.querySelector('.bangle-editor')?.textContent === 'Item 1Item 2',
    {},
    {
      timeout: 2500
    }
  );

  await rowActionsHandleLocator.dragTo(paragraph1Locator, {
    force: true,
    targetPosition: {
      x: 0,
      y: -5
    },
    sourcePosition: {
      x: 0,
      y: 0
    }
  });

  await documentPage.page.waitForFunction(
    () => document.querySelector('.bangle-editor')?.textContent === 'Item 2Item 1',
    {},
    {
      timeout: 2500
    }
  );

  const page = await prisma.page.findUniqueOrThrow({
    where: {
      id: generatedPage.id
    },
    select: {
      content: true
    }
  });

  const pageContent = page.content as PageContent;

  expect(pageContent).toMatchObject({
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        attrs: {
          track: []
        },
        content: [
          {
            text: 'Item 2',
            type: 'text'
          }
        ]
      },
      {
        type: 'paragraph',
        attrs: {
          track: []
        },
        content: [
          {
            text: 'Item 1',
            type: 'text'
          }
        ]
      }
    ]
  });
});
