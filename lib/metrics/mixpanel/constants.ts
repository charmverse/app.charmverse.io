import type { TokenGateAccessType } from 'lib/tokenGates/interfaces';

export const accessTypeDict: Record<TokenGateAccessType, string> = {
  individual_wallet: 'Individual Wallet',
  individual_nft: 'Individual NFT',
  group_token_or_nft: 'Group Token or NFT',
  dao_members: 'DAO Members',
  poap_collectors: 'POAP Collectors',
  nft_subscriber: 'NFT Membership',
  guild: 'Guild.xyz member',
  gitcoin_passport: 'Gitcoin Passport owner'
};
