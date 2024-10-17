import { log } from '@charmverse/core/log';
import { builderCreatorAddress } from '@packages/scoutgame/builderNfts/constants';
import { POST } from '@packages/utils/http';
import type Koa from 'koa';

import { getWalletGasBalanceInUSD } from './getWalletGasBalanceInUSD';

const thresholdUSD = 25;

export async function alertLowWalletGasBalance(
  ctx: Koa.Context,
  discordWebhook: string | undefined = process.env.DISCORD_EVENTS_WEBHOOK
) {
  if (!discordWebhook) {
    throw new Error('No Discord webhook found');
  }

  const balanceInUSD = await getWalletGasBalanceInUSD(builderCreatorAddress);
  log.info(`Admin wallet has a balance of ${balanceInUSD} USD`);
  if (balanceInUSD <= thresholdUSD) {
    await POST(discordWebhook, {
      content: `@Developer : Admin wallet "${builderCreatorAddress}" has a low balance: ${balanceInUSD} USD. (Threshold is ${thresholdUSD} USD)`
    });
  }
}
