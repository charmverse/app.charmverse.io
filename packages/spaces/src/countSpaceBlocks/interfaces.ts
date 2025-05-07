export type BlocksCountQuery = { spaceId: string; batchSize?: number };

export type GenericBlocksCount<T> = {
  total: number;
  details: T;
};
