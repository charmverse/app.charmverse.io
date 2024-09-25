import { test as base } from '@playwright/test';

import { HomePage } from './po/HomePage.po';
import { LoginPage } from './po/LoginPage.po';
import { ProfilePage } from './po/ProfilePage.po';
import { Utilities } from './po/Utilities.po';
import { WelcomePage } from './po/WelcomePage.po';

type Fixtures = {
  homePage: HomePage;
  loginPage: LoginPage;
  profilePage: ProfilePage;
  welcomePage: WelcomePage;
  utils: Utilities;
};

export const test = base.extend<Fixtures>({
  homePage: ({ page }, use) => use(new HomePage(page)),
  loginPage: ({ page }, use) => use(new LoginPage(page)),
  profilePage: ({ page }, use) => use(new ProfilePage(page)),
  welcomePage: ({ page }, use) => use(new WelcomePage(page)),
  utils: ({ page }, use) => use(new Utilities(page))
});

export { chromium, expect } from '@playwright/test';
