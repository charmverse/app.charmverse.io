import { prisma } from '@charmverse/core/prisma-client';
import type { WebSocket } from '@playwright/test';
import { test as base, expect } from '@playwright/test';
import { DocumentPage } from '__e2e__/po/document.po';
import { generateUserAndSpace, loginBrowserUser } from '__e2e__/utils/mocks';

import { websocketsHost } from 'config/constants';
import { _ } from 'testing/prosemirror/builders';

type Fixtures = {
  documentPage: DocumentPage;
};

const test = base.extend<Fixtures>({
  documentPage: async ({ page }, use) => use(new DocumentPage(page))
});

test('Select and delete all blocks in a document', async ({ documentPage }) => {
  const { space, user, page } = await generateUserAndSpace({
    isAdmin: true,
    pageContent: _.doc(_.p('Paragraph 1'), _.p(''), _.p('Paragraph 2')).toJSON()
  });

  await loginBrowserUser({
    browserPage: documentPage.page,
    userId: user.id
  });

  await documentPage.goToPage({
    domain: space.domain,
    path: page.path
  });

  await documentPage.charmEditor.click();
  await documentPage.page.keyboard.press(`${process.platform === 'darwin' ? 'Meta' : 'Control'}+A`);

  // Promisify this, and ensure we don't accidentally spawn a bunch of listeners
  await documentPage.page.on('websocket', async (socket: WebSocket) => {
    await socket.waitForEvent('framereceived', (data) => {
      // Assertion on data shape
      console.log('data', data);

      // Make sure it matches confirm_diff
      return true;
    });
  });

  await documentPage.page.keyboard.press('Backspace');

  await documentPage.page.pause();

  await documentPage.page.waitForTimeout(500);

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
