import { attestGemReceipts } from '@packages/scoutgameattestations/attestGemReceipts';
import type Koa from 'koa';

export async function issueGemsOnchain(ctx: Koa.Context | null) {
  await attestGemReceipts();
}
