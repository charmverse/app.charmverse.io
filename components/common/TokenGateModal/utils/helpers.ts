import type { DisplayedPage } from '../hooks/useTokenGateModalContext';

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
    case 'unlock':
      return 'Unlock Protocol Condition';
    case 'hypersub':
      return 'Hypersub Condition';
    default:
      return 'Select Condition';
  }
}
