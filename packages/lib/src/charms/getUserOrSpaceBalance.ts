import { getUserOrSpaceWallet } from '@packages/lib/charms/getUserOrSpaceWallet';

export type CharmsBalance = { id: string | null; balance: number };

export async function getUserOrSpaceBalance(
  params: ({ userId: string } | { spaceId: string }) & { readOnly?: boolean }
): Promise<CharmsBalance | null> {
  const wallet = await getUserOrSpaceWallet(params);

  return wallet ? { id: wallet.id, balance: wallet.balance } : null;
}
