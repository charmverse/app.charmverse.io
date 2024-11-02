import { log } from '@charmverse/core/log';
import { arrayUtils } from '@charmverse/core/utilities';
import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { builderNftChain } from '@packages/scoutgame/builderNfts/constants';
import type { BuilderScoutedEvent } from '@packages/scoutgame/builderNfts/getOnchainPurchaseEvents';
import { getAndParseNftMintLogs } from '@packages/scoutgame/builderNfts/getOnchainPurchaseEvents';
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

  const earliestBlock = await client.getBlock({ blockNumber: BigInt(earliestBlockNumber) });

  log.info(`Resyncing mint transactions from block ${earliestBlock.number} to ${lastBlock.number}`);

  const onchainPurchaseData = await getAndParseNftMintLogs({
    fromBlock: earliestBlock.number,
    toBlock: lastBlock.number
  });

  const scoutIds = onchainPurchaseData
    .filter((event) => event.eventName === 'BuilderScouted')
    .map((ev) => (ev as any as BuilderScoutedEvent).args.scout);

  const uniqueScoutIds = arrayUtils.uniqueValues(scoutIds);

  for (let i = 0; i < uniqueScoutIds.length; i++) {
    const scoutId = uniqueScoutIds[i];
    log.info(`Syncing NFTs for scout ${scoutId}`);
    await syncUserNFTsFromOnchainData({ scoutId, fromBlock: Number(earliestBlock.number) });
  }

  return uniqueScoutIds as any;
}
