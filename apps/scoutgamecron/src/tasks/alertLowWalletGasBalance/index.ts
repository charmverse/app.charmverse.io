import env from '@beam-australia/react-env';
import { log } from '@charmverse/core/log';
import { POST } from '@packages/utils/http';

import { getWalletGasBalanceInUSD } from './getWalletGasBalanceInUSD';

export async function alertLowWalletGasBalance() {
  const discordWebhook = process.env.DISCORD_EVENTS_WEBHOOK || env('DISCORD_EVENTS_WEBHOOK');

  try {
    const balanceInUSD = await getWalletGasBalanceInUSD('');
    log.info(`Admin wallet has a balance of ${balanceInUSD} USD`);
    if (balanceInUSD > 25) {
      await POST(discordWebhook, {
        content: `Admin wallet has a balance of ${balanceInUSD} USD`
      });
    }
  } catch (error) {
    log.error('Error alerting low wallet gas balance:', { error });
  }
}
