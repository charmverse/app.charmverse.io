import { test as base } from '@playwright/test';

import { ClaimPage } from './po/ClaimPage.po';
import { HomePage } from './po/HomePage.po';
import { InfoPage } from './po/InfoPage.po';
import { LoginPage } from './po/LoginPage.po';
import { ProfilePage } from './po/ProfilePage.po';
import { QuestsPage } from './po/QuestsPage.po';
import { ScoutPage } from './po/ScoutPage.po';
import { UserPage } from './po/UserPage.po';
import { Utilities } from './po/Utilities.po';
import { WelcomePage } from './po/WelcomePage.po';

type Fixtures = {
  homePage: HomePage;
  loginPage: LoginPage;
  profilePage: ProfilePage;
  welcomePage: WelcomePage;
  utils: Utilities;
  infoPage: InfoPage;
  userPage: UserPage;
  scoutPage: ScoutPage;
  claimPage: ClaimPage;
  questsPage: QuestsPage;
};

export const test = base.extend<Fixtures>({
  page: async ({ page }, use) => {
    // Set up routing for all requests
    await page.route('**/*', async (route) => {
      const url = route.request().url();
      if (url.startsWith('https://cdn.charmverse.io/')) {
        const newUrl = url.replace('https://cdn.charmverse.io/', 'http://localhost:3337/');
        // console.log(`Redirecting ${url} to ${newUrl}`);
        await route.fulfill({
          status: 301,
          headers: {
            Location: newUrl
          }
        });
      } else {
        await route.continue();
      }
    });

    // Use the page with the custom routing
    await use(page);
  },
  homePage: ({ page }, use) => use(new HomePage(page)),
  loginPage: ({ page }, use) => use(new LoginPage(page)),
  profilePage: ({ page }, use) => use(new ProfilePage(page)),
  welcomePage: ({ page }, use) => use(new WelcomePage(page)),
  utils: ({ page }, use) => use(new Utilities(page)),
  infoPage: ({ page }, use) => use(new InfoPage(page)),
  userPage: ({ page }, use) => use(new UserPage(page)),
  scoutPage: ({ page }, use) => use(new ScoutPage(page)),
  claimPage: ({ page }, use) => use(new ClaimPage(page)),
  questsPage: ({ page }, use) => use(new QuestsPage(page))
});

export { chromium, expect } from '@playwright/test';
