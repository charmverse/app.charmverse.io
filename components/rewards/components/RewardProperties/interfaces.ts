export const RewardTypes = ['Token', 'Custom'] as const;

export type RewardType = (typeof RewardTypes)[number];

export type RewardTokenDetails = {
  chainId: number;
  contractAddress: string;
  rewardAmount: number;
};
