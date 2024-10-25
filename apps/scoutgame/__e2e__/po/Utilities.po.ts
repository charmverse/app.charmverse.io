import crypto from 'node:crypto';

import { log } from '@charmverse/core/log';
import { installMockWallet } from '@johanneskares/wallet-mock';
import type { Page } from '@playwright/test';
import type { Transport } from 'viem';
import { http, isHex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { optimism, optimismSepolia } from 'viem/chains';

export class Utilities {
  // eslint-disable-next-line no-useless-constructor
  constructor(private page: Page) {
    // silence is golden
  }

  async loginAsUserId(userId: string) {
    return this.page.request.get(`/api/login-dev?userId=${userId}`);
  }

  async initMockWallet(httpTransport?: Record<number, Transport>) {
    const privateKey = `0x${crypto.randomBytes(32).toString('hex')}`;
    const addressKey = isHex(privateKey) ? privateKey : null;

    // This can actually call the real chain or mock it. Ideally we want to mock it.
    const transports = httpTransport || { [optimismSepolia.id]: http() };

    if (!addressKey) {
      log.error('Invalid private key in testing installMockWallet.');
      return;
    }

    await installMockWallet({
      page: this.page,
      account: privateKeyToAccount(addressKey),
      defaultChain: optimism,
      transports
    });
  }
}
