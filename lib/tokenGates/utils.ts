import { isTruthy } from '@packages/utils/types';
import type { AccessControlCondition } from '@root/lib/tokenGates/interfaces';

type GateType = 'Wallet' | 'Collectibles' | 'Tokens' | 'Community' | 'Credential';

type AccessType =
  | 'ERC721'
  | 'ERC1155'
  | 'POAP'
  | 'Unlock'
  | 'Hypersub'
  | 'ERC20'
  | 'Wallet'
  | 'Hats'
  | 'Guild'
  | 'Builder'
  | 'Moloch'
  | 'Gitcoin holder'
  | 'Gitcoin score';

/**
 * Used for creating analytics events
 * @param condition AccessControlCondition
 */
export function getAccessType(condition: AccessControlCondition): AccessType | null {
  const { type, quantity } = condition;

  switch (type) {
    case 'Wallet':
      return 'Wallet';
    case 'ERC721':
      return 'ERC721';
    case 'POAP':
      return 'POAP';
    case 'MolochDAOv2.1':
      return 'Moloch';
    case 'Builder':
      return 'Builder';
    case 'Hypersub':
      return 'Hypersub';
    case 'Unlock':
      return 'Unlock';
    case 'GitcoinPassport':
      if (quantity === '0') {
        return 'Gitcoin holder';
      } else {
        return 'Gitcoin score';
      }
    case 'Guildxyz':
      return 'Guild';
    case 'ERC1155':
      return 'ERC1155';
    case 'ERC20':
      return 'ERC20';
    case 'Hats':
      return 'Hats';
    default:
      return null;
  }
}

/**
 * Used for creating analytics events
 * @param condition AccessControlCondition
 */
export function getGateType(condition: AccessControlCondition): GateType | null {
  const { type } = condition;

  switch (type) {
    case 'Wallet':
      return 'Wallet';
    case 'ERC20':
      return 'Tokens';
    case 'GitcoinPassport':
      return 'Credential';
    case 'MolochDAOv2.1':
    case 'Builder':
    case 'Guildxyz':
    case 'Hats':
      return 'Community';
    case 'ERC721':
    case 'ERC1155':
    case 'POAP':
    case 'Hypersub':
    case 'Unlock':
      return 'Collectibles';
    default:
      return null;
  }
}

export function getAccessTypes(conditions: AccessControlCondition[]): AccessType[] {
  return conditions.map((c) => getAccessType(c)).filter(isTruthy);
}

export function getGateTypes(conditions: AccessControlCondition[]): GateType[] {
  return conditions.map((c) => getGateType(c)).filter(isTruthy);
}
