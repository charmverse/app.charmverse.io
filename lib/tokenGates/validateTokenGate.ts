import { log } from '@charmverse/core/log';
import type { UserWallet } from '@charmverse/core/prisma-client';

import type { TokenGate } from './interfaces';
import { validateTokenGateConditionWithDelegates } from './validateTokenGateConditionWithDelegates';
/**
 * Used for validating token gates. Returns token gate id or null if not valid
 * @param tokenGate TokenGate
 * @param walletAddress string
 * @returns string | null
 */
export async function validateTokenGate(tokenGate: TokenGate, walletAddress: string): Promise<string | null> {
  const tokenGatesValid = await Promise.all(
    (tokenGate.conditions.accessControlConditions || []).map((condition) =>
      validateTokenGateConditionWithDelegates(condition, walletAddress)
    )
  );
  const allConditionsAreValid = tokenGate.conditions.operator === 'AND' && tokenGatesValid.every((v) => v);

  const someConditionsAreValid =
    (tokenGate.conditions.operator === 'OR' || !tokenGate.conditions.operator) && tokenGatesValid.some((v) => v);

  if (someConditionsAreValid || allConditionsAreValid) {
    return tokenGate.id;
  } else {
    return null;
  }
}

export async function validateTokenGateWithMultipleWallets(
  tokenGate: TokenGate,
  wallets: UserWallet[]
): Promise<string | null> {
  const values = await Promise.all(
    wallets.map(async (w) =>
      validateTokenGate(tokenGate, w.address).catch((error) => {
        log.debug(`Error validating token gate`, { tokenGateId: tokenGate.id, userWalletId: w.id, error });
        return null;
      })
    )
  );

  return values.some((v) => !!v) ? tokenGate.id : null;
}
