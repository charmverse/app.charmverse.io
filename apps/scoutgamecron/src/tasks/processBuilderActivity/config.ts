import type { GemsReceiptType } from '@charmverse/core/prisma-client';

export const gemsValues: Record<GemsReceiptType, number> = {
  first_pr: 100,
  third_pr_in_streak: 30,
  regular_pr: 10,
  daily_commit: 1
};
