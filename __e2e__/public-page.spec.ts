import { Browser, chromium, test, expect } from '@playwright/test';
import { Space } from '@prisma/client';
import { IPageWithPermissions } from 'lib/pages/interfaces';
import { LoggedInUser } from 'models';
import { baseUrl } from 'testing/mockApiCall';
import { v4 } from 'uuid';

let browser: Browser;

test.beforeAll(async () => {
  browser = await chromium.launch({ headless: false });
});

test('login - sets a cookie inside the user browser', async () => {

  const userContext = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await userContext.newPage();

  // Arrange
  const walletAddress = v4();

  // Act
  const profile: LoggedInUser = await page.request.post(`${baseUrl}/api/profile`, {
    data: {
      address: walletAddress
    }
  }).then(res => res.json());

  const domain = `domain-${v4()}`;

  const space: Space = await page.request.post(`${baseUrl}/api/spaces`, {
    data: {
      author: {
        connect: {
          id: profile.id
        }
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      updatedBy: profile.id,
      spaceRoles: {
        create: [{
          isAdmin: true,
          user: {
            connect: {
              id: profile!.id
            }
          }
        }]
      },
      domain,
      name: 'Testing space'
    }
  }).then(res => res.json());

  const pages: IPageWithPermissions[] = await page.request.get(`${baseUrl}/api/spaces/${space.id}/pages`).then(res => res.json());

  const firstRootPage = pages.find(p => !p.parentId);

  //
  await page.goto(`${baseUrl}`);

  // Click p:has-text("[Your DAO] Home"

  const targetRedirectPath = `${baseUrl}/${domain}/${firstRootPage?.path}`;

  await page.waitForURL(targetRedirectPath);

  await page.locator('[aria-label="Share or publish to the web"]').click();

  const publicShareToggle = await page.locator('[type=checkbox]');

  await publicShareToggle.click();

  const shareUrl = `${baseUrl}/share/${domain}/${firstRootPage?.path}`;

  await page.waitForResponse(/\/api\/permissions/);

  // Test that the content of the input will contain the url and that it gets passed to the clipboard
  const shareLinkInput = await page.locator('data-test=share-link').locator('input');

  //  expect(shareLinkInput.innerText()).toBe(shareUrl);
  const inputValue = await shareLinkInput.inputValue();

  expect(inputValue).toBe(shareUrl);

  await page.locator('text=Copy').click({ force: true });

  const clipboardContent = await page.evaluate(async () => {
    return navigator.clipboard.readText();
  });

  expect(clipboardContent).toBe(shareUrl);

  // Open new page as non logged in user ------------------------------------------------------
  const publicContext = await browser.newContext({});

  const page1 = await publicContext.newPage();

  // Go to http://localhost:3335/share/domain-3459c5af-272f-40f0-9dcf-899c85e95b72/page-19377272787222233
  await page1.goto(`${baseUrl}/share/${domain}/${firstRootPage?.path}`);

  // Click p:has-text("[Your DAO] Home")
  await page1.locator('p:has-text("[Your DAO] Home")').click();

  // Click text=Welcome to [Your DAO]!
  await page1.locator('text=Welcome to [Your DAO]!').click();

  // Click text=Team Tasks
  await page1.locator('text=Team Tasks').click();
  await page1.waitForURL('http://localhost:3335/share/980dbe11-41c7-40d8-ae39-ab92544c62c1?viewId=9bab1ff2-2e20-4afe-8e0e-933d1a753b25&cardId=');

  // Click [aria-label="Close"]
  await page1.locator('[aria-label="Close"]').click();

  // Click [placeholder="Untitled board"]
  await page1.locator('[placeholder="Untitled board"]').click();

  // Click text=Partner with CharmVerse
  await page1.locator('text=Partner with CharmVerse').click();
  await page1.waitForURL('http://localhost:3335/share/980dbe11-41c7-40d8-ae39-ab92544c62c1?viewId=9bab1ff2-2e20-4afe-8e0e-933d1a753b25&cardId=c02fbc60-32f1-45ed-9848-2b8fab667caa');

  // Click text=Not started
  await page1.locator('text=Not started').click();

  // Click div[role="dialog"] >> text=High
  await page1.locator('div[role="dialog"] >> text=High').click();

  // Click div[role="dialog"] >> text=Partnerships
  await page1.locator('div[role="dialog"] >> text=Partnerships').click();

  // Assert -------------

});

