import type { AccessControlCondition, TokenGateAccessType } from 'lib/tokenGates/interfaces';

/**
 * Used for creating analytics events
 * @param condition AccessControlCondition
 * @returns TokenGateAccessType
 */
export function getAccessType(condition: AccessControlCondition): TokenGateAccessType {
  const { type } = condition;

  switch (type) {
    case 'Wallet':
      return 'individual_wallet';
    case 'ERC721':
      return 'individual_nft';
    case 'POAP':
      return 'poap_collectors';
    case 'MolochDAOv2.1':
    case 'Builder':
      return 'dao_members';
    case 'Hypersub':
    case 'Unlock':
      return 'nft_subscriber';
    case 'GitcoinPassport':
      return 'gitcoin_passport';
    case 'Guildxyz':
      return 'guild';
    case 'ERC1155':
    case 'ERC20':
    default:
      return 'group_token_or_nft';
  }
}

export function getAccessTypes(conditions: AccessControlCondition[]): TokenGateAccessType[] {
  return conditions.map((c) => getAccessType(c));
}
