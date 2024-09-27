import type { Page } from '@playwright/test';

export class GeneralPageLayout {
  // eslint-disable-next-line no-useless-constructor
  constructor(
    protected page: Page,
    public signInButton = page.locator('data-test=sign-in-button'),
    public siteNavigation = page.locator('data-test=site-navigation').first(),
    public selectNavigationLink = (link: string) =>
      page.locator(`data-test=site-navigation >> [href*="${link}"]`).first()
  ) {
    // silence is golden
  }
}
