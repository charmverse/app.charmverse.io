import { log } from '@charmverse/core/log';
import { arrayUtils } from '@charmverse/core/utilities';
import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { getBuilderScoutedEvents } from '@packages/scoutgame/builderNfts/accounting/getBuilderScoutedEvents';
import { builderNftChain } from '@packages/scoutgame/builderNfts/constants';
import { syncUserNFTsFromOnchainData } from '@packages/scoutgame/builderNfts/syncUserNFTsFromOnchainData';

const averageOptimismBlockTimeInSeconds = 2;

/**
 * Offsets the requested time by 90 seconds to not interfere with active purchase handling processes
 *
 * So 5 minutes ago will be 6.5 minutes ago > 1.5 minutes ago
 */
export async function resolveMissingPurchases({ minutesAgoToNow }: { minutesAgoToNow: number }): Promise<void> {
  const client = getPublicClient(builderNftChain.id);

  let lastBlock = await client.getBlock();

  const lastBlockNumberWithSafetyMargin = Number(lastBlock.number) - Math.ceil(90 / averageOptimismBlockTimeInSeconds);

  lastBlock = await client.getBlock({ blockNumber: BigInt(lastBlockNumberWithSafetyMargin) });

  const blockOffset = Math.floor((minutesAgoToNow * 60) / averageOptimismBlockTimeInSeconds);

  const earliestBlockNumber = Number(lastBlock.number) - blockOffset;

  log.info(`Resyncing mint transactions from block ${earliestBlockNumber} to ${lastBlock.number}`);

  const builderScoutedEvents = await getBuilderScoutedEvents({ fromBlock: earliestBlockNumber });

  const scoutIds = builderScoutedEvents.map((ev) => ev.args.scout);

  const uniqueScoutIds = arrayUtils.uniqueValues(scoutIds);

  for (let i = 0; i < uniqueScoutIds.length; i++) {
    const scoutId = uniqueScoutIds[i];
    log.info(`Syncing NFTs for scout ${scoutId}`);
    await syncUserNFTsFromOnchainData({ scoutId, fromBlock: Number(earliestBlockNumber) });
  }

  return uniqueScoutIds as any;
}
