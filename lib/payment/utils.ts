export type Usage = '1' | '2' | '3' | '4' | '5';

export const UsageRecord: Record<
  Usage,
  {
    totalBlocks: number;
    totalActiveUsers: number;
    pricing: number;
  }
> = {
  '1': {
    totalBlocks: 5000,
    totalActiveUsers: 25,
    pricing: 10
  },
  '2': {
    totalBlocks: 10000,
    totalActiveUsers: 35,
    pricing: 20
  },
  '3': {
    totalBlocks: 25000,
    totalActiveUsers: 50,
    pricing: 30
  },
  '4': {
    totalBlocks: 35000,
    totalActiveUsers: 75,
    pricing: 40
  },
  '5': {
    totalBlocks: 100000,
    totalActiveUsers: 100,
    pricing: 50
  }
};
