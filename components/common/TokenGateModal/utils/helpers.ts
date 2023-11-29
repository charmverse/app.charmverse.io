import type { UnifiedAccessControlConditions } from '@lit-protocol/types';

import { isTruthy } from 'lib/utilities/types';

import type { DisplayedPage } from '../hooks/useTokenGateModalContext';

export const createAuthSigs = (conditions: UnifiedAccessControlConditions) => {
  const newConditions = conditions
    .map((condition) => {
      if ('conditionType' in condition && condition.conditionType === 'evmBasic') {
        return 'ethereum';
      }
      if ('conditionType' in condition && condition.conditionType === 'solRpc') {
        return 'solana';
      }
      return null;
    })
    .filter(isTruthy);

  return [...new Set(newConditions)];
};

export const getAllChains = (conditions: UnifiedAccessControlConditions) => {
  const newConditions = conditions.map((c) => 'chain' in c && c.chain).filter(isTruthy);
  return [...new Set(newConditions)];
};

export function getTitle(page: DisplayedPage) {
  switch (page) {
    case 'home':
      return 'Add a Token Gate';
    case 'collectables':
      return 'Digital Collectibles';
    case 'tokens':
      return 'Tokens';
    case 'review':
      return 'Review Conditions';
    case 'wallet':
      return 'Wallet Condition';
    case 'dao':
      return 'DAO Condition';
    default:
      return 'Select Condition';
  }
}
