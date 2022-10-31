import type { Page } from '@playwright/test';

import { baseUrl } from 'config/constants';

export function login ({ page, userId }: { userId: string, page: Page }) {
  return page.request.post(`${baseUrl}/api/session/login-testenv`, {
    data: {
      userId
    }
  });
}
