import { prisma } from '@charmverse/core/prisma-client';
import { test as base, expect } from '@playwright/test';

import { emptyDocument } from 'lib/prosemirror/constants';
import { createThread, toggleThreadStatus } from 'lib/threads';

import { DocumentPage } from './po/document.po';
import { generateUserAndSpace, loginBrowserUser } from './utils/mocks';

type Fixtures = {
  documentPage: DocumentPage;
};

const test = base.extend<Fixtures>({
  documentPage: async ({ page }, use) => use(new DocumentPage(page))
});

test.describe.serial('Create a inline comment thread and check if the page action sidebar toggles', async () => {
  const { space, user, page: generatedPage } = await generateUserAndSpace({ isAdmin: true });

  const thread = await createThread({
    comment: emptyDocument,
    context: 'Context',
    pageId: generatedPage.id,
    userId: user.id
  });

  const threadId = thread.id;

  test('Check if the inline comment thread is visible after adding comment to text', async ({ documentPage }) => {
    await prisma.page.update({
      where: {
        id: generatedPage.id
      },
      data: {
        content: [
          {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'Comment',
                    marks: [{ type: 'inline-comment', attrs: { id: threadId, resolved: false } }]
                  }
                ]
              }
            ]
          }
        ]
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

    const threadBoxLocator = documentPage.page.locator(`data-test=thread.${threadId}`);

    await expect(threadBoxLocator).toBeVisible();
  });

  test('Check if the inline comment thread is not visible after resolving it', async ({ documentPage }) => {
    await toggleThreadStatus({
      id: threadId,
      status: 'closed'
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

    const threadBoxLocator = documentPage.page.locator(`data-test=thread.${threadId}`);

    await expect(threadBoxLocator).not.toBeVisible();
  });
});
