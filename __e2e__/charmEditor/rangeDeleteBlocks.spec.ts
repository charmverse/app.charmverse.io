import { prisma } from '@charmverse/core/prisma-client';
import type { Page } from '@playwright/test';
import { test as base, expect } from '@playwright/test';
import { DocumentPage } from '__e2e__/po/document.po';
import { generateUserAndSpace, loginBrowserUser } from '__e2e__/utils/mocks';

import { _ } from 'testing/prosemirror/builders';

type Fixtures = {
  documentPage: DocumentPage;
};

const test = base.extend<Fixtures>({
  documentPage: async ({ page }, use) => use(new DocumentPage(page))
});

const confirmDiffFrameReceived = (page: Page) => {
  return new Promise<void>((resolve) => {
    page.on('websocket', (ws) => {
      ws.on('framereceived', (event) => {
        if (event.payload.toString().includes('confirm_diff')) {
          resolve();
        }
      });
    });
  });
};

test.fixme('Select and delete all blocks in a document', async ({ documentPage }) => {
  const { space, user, page } = await generateUserAndSpace({
    isAdmin: true,
    pageContent: _.doc(_.p('Paragraph 1'), _.p(''), _.p('Paragraph 2')).toJSON()
  });

  await loginBrowserUser({
    browserPage: documentPage.page,
    userId: user.id
  });

  const confirmDiffFrameReceivedPromise = confirmDiffFrameReceived(documentPage.page);

  await documentPage.goToPage({
    domain: space.domain,
    path: page.path
  });

  await documentPage.charmEditor.click();
  await documentPage.page.keyboard.press(`${process.platform === 'darwin' ? 'Meta' : 'Control'}+A`);
  await documentPage.page.keyboard.press('Backspace');

  await confirmDiffFrameReceivedPromise;

  const updatedPage = await prisma.page.findUniqueOrThrow({
    where: {
      id: page.id
    },
    select: {
      content: true
    }
  });

  expect(updatedPage.content).toStrictEqual({ content: [{ attrs: { track: [] }, type: 'paragraph' }], type: 'doc' });
});
