import { useGET, usePUT } from 'charmClient/hooks/helpers';
import type { TransactionResult } from 'lib/charms/addTransaction';
import type { SpaceCharmsStatus } from 'lib/charms/getSpacesCharmsStatus';
import type { CharmsBalance } from 'lib/charms/getUserOrSpaceWallet';
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
  page,
  pageSize
}: {
  userId?: string;
  page: number;
  pageSize?: number;
}) {
  return useGET<CharmsBalance>(userId ? `/api/profile/charms/history` : null, { page, pageSize });
}

export function useTransferCharms() {
  return usePUT<TransferCharmsInput, TransactionResult>(`/api/profile/charms`);
}
