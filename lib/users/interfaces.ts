import type { SupportedChainId } from 'lib/blockchain/provider/alchemy';

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
