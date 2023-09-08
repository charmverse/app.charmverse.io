import type { CollectModules } from '@lens-protocol/client';

export type CollectModuleType = {
  type?: CollectModules;
  amount?: { currency: string | null; value: string | null } | null;
  referralFee?: number | null;
  collectLimit?: string | null;
  timeLimit?: boolean;
  recipients?: any[];
  followerOnlyCollect?: boolean;
};
