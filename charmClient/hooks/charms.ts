import useSWRInfinite from 'swr/infinite';

import * as http from 'adapters/http';
import { useGET, usePUT } from 'charmClient/hooks/helpers';
import type { TransactionResult } from 'lib/charms/addTransaction';
import { TRANSACTIONS_PAGE_SIZE } from 'lib/charms/constants';
import type { LeaderBoardUser } from 'lib/charms/getLeaderBoard';
import type { SpaceCharmsStatus } from 'lib/charms/getSpacesCharmsStatus';
import type { CharmsBalance } from 'lib/charms/getUserOrSpaceBalance';
import type { HistoryTransaction } from 'lib/charms/listTransactionsHistory';
import type { TransferCharmsInput } from 'lib/charms/transferCharms';

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
  return useGET<LeaderBoardUser[]>(`/api/profile/charms/leaderboard`);
}
