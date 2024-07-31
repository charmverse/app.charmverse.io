import type { Page as BrowserPage } from '@playwright/test';

export async function loginBrowserUser({
  browserPage,
  userId
}: {
  browserPage: BrowserPage;
  userId: string;
}): Promise<void> {
  await browserPage.request.get(`/api/login-dev?userId=${userId}`);
}
