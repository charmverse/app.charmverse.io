import type { TokenGateAccessType } from 'lib/token-gates/interfaces';

export const accessTypeDict: Record<TokenGateAccessType, string> = {
  individual_wallet: 'Individual Wallet',
  individual_nft: 'Individual NFT',
  group_token_or_nft: 'Group Token or NFT',
  dao_members: 'DAO Members',
  poap_collectors: 'POAP Collectors',
  cask_subscribers: 'Cask Subscribers'
};
