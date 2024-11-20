import { log } from '@charmverse/core/log';
import { builderCreatorAddress } from '@packages/scoutgame/builderNfts/constants';
import { scoutgameMintsLogger } from '@packages/scoutgame/loggers/mintsLogger';
import { POST } from '@packages/utils/http';
import type Koa from 'koa';

import { getWalletGasBalanceInUSD } from './getWalletGasBalanceInUSD';

const thresholdUSD = 25;

export async function alertLowWalletGasBalance(
  ctx: Koa.Context,
  discordWebhook: string | undefined = process.env.DISCORD_ALERTS_WEBHOOK
) {
  if (!discordWebhook) {
    throw new Error('No Discord webhook found');
  }

  const balanceInUSD = await getWalletGasBalanceInUSD(builderCreatorAddress);
  scoutgameMintsLogger.info(`Admin wallet has a balance of ${balanceInUSD} USD`);
  if (balanceInUSD <= thresholdUSD) {
    await POST(discordWebhook, {
      content: `<@&1027309276454207519>: Admin wallet has a low balance: ${balanceInUSD} USD. (Threshold is ${thresholdUSD} USD)`,
      embeds: [
        {
          title: `View wallet: ${builderCreatorAddress}`,
          url: 'https://optimism.blockscout.com/address/0x518AF6fA5eEC4140e4283f7BDDaB004D45177946'
        }
      ]
    });
  }
}
