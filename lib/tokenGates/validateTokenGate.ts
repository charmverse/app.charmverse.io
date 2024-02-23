import type { TokenGate } from './interfaces';
import { validateTokenGateCondition } from './validateTokenGateCondition';

/**
 * Used for validating token gates. Returns token gate id or null if not valid
 * @param tokenGate TokenGate
 * @param walletAddress string
 * @returns string | null
 */
export async function validateTokenGate(tokenGate: TokenGate, walletAddress: string) {
  const tokenGatesValid = await Promise.all(
    tokenGate.conditions.accessControlConditions?.map(async (condition) =>
      validateTokenGateCondition(condition, walletAddress)
    ) || []
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
