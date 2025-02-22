import type { SupportedChainId } from '@root/lib/blockchain/getNFTs';

export interface UserAvatar {
  avatar: string | null;
  avatarContract: string | null;
  avatarTokenId: string | null;
  avatarChain: SupportedChainId | null;
}

export type UserPreferences = {
  locale?: string | null;
  timezone?: string | null;
};
