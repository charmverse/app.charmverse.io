type GithubEvent = {
  createdBy: number; // Githubuser
  pullRequestNumber: number;
  type: 'merged_pull_request';
};

type GemsPayoutEvent = {
  id: string;
  builderId: string;
  points: number;
};

type NFTPurchaseEvent = {
  createdAt: Date;
  contract: string;
  tokenId: number;
  builderId: string;
  scoutId: string;
  points: number;
};

type BuilderEvent = {
  builderId: string;
  type: 'github_event' | 'waitlist_airdrop' | 'nft_purchase' | 'gems_payout';

  gemsEventId?: string;
  gemsEvent?: GemsPayoutEvent;

  githubEventId?: string;
  githubEvent?: GithubEvent;

  nftPurchaseEventId?: string;
};

// for github events
type GemsReceipt = {
  id: string;
  eventId: string;
  event: BuilderEvent;
  type: 'first_commit';
  value: number;
  recipientId?: string;
};

// for gems_payout, nft_purchase, and waitlist_airdrop
type PointsReceipt = {
  id: string;
  eventId: string;
  event: BuilderEvent;
  value: number;
  recipientId?: string;
  senderId?: string; // when an NFT is purchased
};

const gemsToPoints = 1;

// calculate a builder's points based on gems
export function getBuilderPointsFromGems(builderId: string, receipts: GemsReceipt[]) {
  const gemsEarned = receipts.reduce<number>((acc, receipt) => {
    if (receipt.recipientId === builderId) {
      return acc + receipt.value;
    }
    return acc;
  }, 0);
  return gemsEarned * gemsToPoints;
}

// retrun the % of points earned by a scout from an NFT
export function getNFTScoutSplit(contract: string, tokenId: number, nftEvents: NFTPurchaseEvent[]) {
  const nfts = nftEvents.filter((nft) => nft.contract === contract);
  // TODO: apply actual equation
  return 100 / nfts.length;
}

// get the points for a user based on NFTs and gem receipts
export function getPointsFromGems(userId: string, nftEvents: NFTPurchaseEvent[], receipts: GemsReceipt[]) {
  const nfts = nftEvents.filter((nft) => nft.builderId === userId);
  const pointsFromNFTs = nfts.reduce((acc, nft) => {
    const builderPoints = getBuilderPointsFromGems(nft.builderId, receipts);
    const scoutSplit = getNFTScoutSplit(nft.contract, nft.tokenId, nftEvents);
    return acc + builderPoints * scoutSplit;
  }, 0);
  return pointsFromNFTs + getBuilderPointsFromGems(userId, receipts);
}

// calculate a user's current points balance based on receipts
export function getCurrentPointsBalance(builderId: string, receipts: PointsReceipt[]) {
  return receipts.reduce<number>((acc, receipt) => {
    if (receipt.recipientId === builderId) {
      return acc + receipt.value;
    } else if (receipt.senderId === builderId) {
      return acc - receipt.value;
    }
    return acc;
  }, 0);
}

// get points for: merge pull requests
export function getPointsEarnedAsBuilder(builderId: string, receipts: PointsReceipt[]) {
  return receipts.reduce<number>((acc, receipt) => {
    if (receipt.recipientId === builderId) {
      // receipt from github events by builder
      if (receipt.event.type === 'github_event' && receipt.event.builderId === builderId) {
        return acc + receipt.value;
      }
    }
    return acc;
  }, 0);
}

// get points for: merge pull requests from other users
export function getPointsEarnedAsScout(scoutId: string, receipts: PointsReceipt[]) {
  return receipts.reduce<number>((acc, receipt) => {
    if (receipt.recipientId === scoutId) {
      // receipt from github events by someone else
      if (receipt.event.type === 'github_event' && receipt.event.builderId !== scoutId) {
        return acc + receipt.value;
      }
      // receipt for payout
      if (receipt.event.type === 'gems_payout') {
        return acc + receipt.value;
      }
    }
    return acc;
  }, 0);
}
