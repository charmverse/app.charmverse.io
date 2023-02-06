import { test as base, expect } from '@playwright/test';
import { EditorPage } from '__e2e__/po/editorPage.po';
import { generateUserAndSpace } from '__e2e__/utils/mocks';
import { generatePage } from '__e2e__/utils/pages';
import { login } from '__e2e__/utils/session';
import { v4 } from 'uuid';

type Fixtures = {
  editorPage: EditorPage;
};

const test = base.extend<Fixtures>({
  editorPage: ({ page }, use) => use(new EditorPage(page))
});

test('Space settings - update the space name and domain', async ({ page, editorPage }) => {
  const { space, user: spaceUser } = await generateUserAndSpace({ spaceName: v4(), isAdmin: true, onboarded: true });
  await login({ page, userId: spaceUser.id });

  const testPage = await generatePage({
    createdBy: space.createdBy,
    spaceId: space.id,
    title: 'Test page',
    pagePermissions: [{ permissionLevel: 'full_access', spaceId: space.id }]
  });

  editorPage.pageId = testPage.id;

  await editorPage.goTo({ domain: space.domain, pagePath: testPage.path });
  await editorPage.waitForUrl({ domain: space.domain, pagePath: testPage.path });
  const pageTitle = await editorPage.documentTitle.textContent();

  expect(pageTitle).toBe(testPage.title);
  expect(await editorPage.isEditable()).toBe(true);
});
