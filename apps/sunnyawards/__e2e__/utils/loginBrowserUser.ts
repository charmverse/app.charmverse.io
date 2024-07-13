import type { Page as BrowserPage } from '@playwright/test';

import { connectApiHost } from '@root/config/constants';

export async function loginBrowserUser({
  browserPage,
  userId
}: {
  browserPage: BrowserPage;
  userId: string;
}): Promise<void> {
  await browserPage.request.get(`${connectApiHost}/api/session/login-dev?userId=${userId}`);
}
