import * as http from '@packages/adapters/http';
import useSWRInfinite from 'swr/infinite';

import { useGET, usePUT } from 'charmClient/hooks/helpers';
import type { TransactionResult } from '@packages/lib/charms/addTransaction';
import { TRANSACTIONS_PAGE_SIZE } from '@packages/lib/charms/constants';
import type { LeaderBoardData } from '@packages/lib/charms/getLeaderBoard';
import type { SpaceCharmsStatus } from '@packages/lib/charms/getSpacesCharmsStatus';
import type { CharmsBalance } from '@packages/lib/charms/getUserOrSpaceBalance';
import type { HistoryTransaction } from '@packages/lib/charms/listTransactionsHistory';
import type { TransferCharmsInput } from '@packages/lib/charms/transferCharms';

export function useUserCharms(userId?: string) {
  return useGET<CharmsBalance | null>(userId ? '/api/profile/charms' : null);
}

export function useSpacesCharmsState(userId?: string) {
  return useGET<SpaceCharmsStatus[]>(userId ? `/api/profile/charms/spaces` : null);
}

export function useSpaceCharms(spaceId: string, userId?: string) {
  return useGET<CharmsBalance>(userId && spaceId ? `/api/spaces/${spaceId}/charms` : null);
}

export function useTransactionHistory({
  userId,
  pageSize = TRANSACTIONS_PAGE_SIZE
}: {
  userId?: string;
  pageSize?: number;
}) {
  return useSWRInfinite(
    (index) =>
      userId
        ? {
            url: '/api/profile/charms/history',
            arguments: { userId, page: index }
          }
        : null,
    (args) =>
      http.GET<HistoryTransaction[]>(args.url, {
        pageSize,
        page: args.arguments.page || 0
      }),
    { revalidateOnFocus: true, revalidateOnMount: true }
  );
}

export function useTransferCharms() {
  return usePUT<TransferCharmsInput, TransactionResult>(`/api/profile/charms`);
}

export function useCharmsLeaderBoard() {
  return useGET<LeaderBoardData>(`/api/profile/charms/leaderboard`);
}
