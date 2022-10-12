import type { Page } from '@playwright/test';
import type { Space } from '@prisma/client';

import { generateTokenGate } from './mocks';

export async function generateAndMockTokenGateRequests ({
  space,
  userId,
  page,
  address,
  spaceUserId,
  canJoinSpace = true
}: {
  address: string;
  userId: string;
  space: Space;
  page: Page;
  spaceUserId: string;
  canJoinSpace?: boolean;
}) {
  const tokenGate = await generateTokenGate({
    spaceId: space.id,
    userId: spaceUserId
  });

  await page.route('**/api/token-gates', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([tokenGate])
    });
  });

  await page.route('**/api/token-gates/evaluate', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        userId,
        space,
        walletAddress: address,
        canJoinSpace,
        gateTokens: [{ tokenGate, signedToken: '' }],
        roles: []
      })
    });
  });

  // Only mock this endpoint response if the user can join the workspace (ie token gate success)
  if (canJoinSpace) {
    await page.route('**/api/token-gates/verify', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true
        })
      });
    });
  }

  return tokenGate;
}
