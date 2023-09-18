import { prisma } from '@charmverse/core/prisma-client';
import { test as base, expect } from '@playwright/test';

import type { PageContent } from 'lib/prosemirror/interfaces';
import { createPage } from 'testing/setupDatabase';

import { DocumentPage } from '../po/document.po';
import { generateUserAndSpace, loginBrowserUser } from '../utils/mocks';

type Fixtures = {
  documentPage: DocumentPage;
};

const test = base.extend<Fixtures>({
  documentPage: async ({ page }, use) => use(new DocumentPage(page))
});

test('Drag and drop a nested page node over a linked page node in the CharmEditor', async ({ documentPage }) => {
  const { space, user, page: generatedPage } = await generateUserAndSpace({ isAdmin: true });

  const nestedPage = await createPage({
    spaceId: space.id,
    createdBy: user.id,
    title: 'Nested Page',
    parentId: generatedPage.id,
    pagePermissions: [
      {
        spaceId: space.id,
        permissionLevel: 'full_access'
      }
    ]
  });

  const linkedPage = await createPage({
    spaceId: space.id,
    createdBy: user.id,
    title: 'Linked Page',
    pagePermissions: [
      {
        spaceId: space.id,
        permissionLevel: 'full_access'
      }
    ]
  });

  await prisma.page.update({
    where: {
      id: generatedPage.id
    },
    data: {
      content: {
        type: 'doc',
        content: [
          {
            type: 'page',
            attrs: { id: nestedPage.id, track: [] }
          },
          {
            type: 'linkedPage',
            attrs: { id: linkedPage.id, track: [] }
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

  const nestedPageLocator = documentPage.page.locator('.bangle-editor-core .page-container');
  const linkedPageLocator = documentPage.page.locator('.bangle-editor-core .linkedPage-container');
  await linkedPageLocator.hover();

  const rowActionsHandleLocator = documentPage.page.locator('.bangle-editor-core .charm-drag-handle');
  await expect(rowActionsHandleLocator).toBeVisible();
  await rowActionsHandleLocator.dragTo(nestedPageLocator, {
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

  await documentPage.page.waitForTimeout(1000);

  const documentText = await documentPage.getDocumentText();
  expect(documentText).toBe(`${linkedPage.title}${nestedPage.title}`);

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
        type: 'linkedPage',
        attrs: { id: linkedPage.id, track: [] }
      },
      {
        type: 'page',
        attrs: { id: nestedPage.id, track: [] }
      },
      {
        type: 'paragraph',
        attrs: {
          track: []
        }
      }
    ]
  });
});
