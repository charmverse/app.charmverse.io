import { prisma } from '@charmverse/core/prisma-client';
import { emptyDocument } from '@packages/charmeditor/constants';
import { createThread, toggleThreadStatus } from '@packages/lib/threads';
import { expect, test } from '__e2e__/testWithFixtures';

import { generateUserAndSpace, loginBrowserUser } from './utils/mocks';

test.describe('Create a inline comment thread and check if the page action sidebar toggles', async () => {
  test('Check if the inline comment thread is visible after adding comment to text', async ({ documentPage }) => {
    const { space, user, page: generatedPage } = await generateUserAndSpace({ isAdmin: true });

    const thread = await createThread({
      comment: emptyDocument,
      context: 'Context',
      pageId: generatedPage.id,
      userId: user.id
    });

    const threadId = thread.id;
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
    const { space, user, page: generatedPage } = await generateUserAndSpace({ isAdmin: true });

    const thread = await createThread({
      comment: emptyDocument,
      context: 'Context',
      pageId: generatedPage.id,
      userId: user.id
    });

    const threadId = thread.id;
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
