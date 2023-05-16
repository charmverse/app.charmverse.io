import type { User } from '@charmverse/core/prisma';

export type NotificationActor = Pick<
  User,
  'id' | 'username' | 'path' | 'avatar' | 'avatarContract' | 'avatarTokenId' | 'avatarChain' | 'deletedAt'
>;

export function mapNotificationActor(user: User | null): NotificationActor | null {
  if (!user) return null;

  return {
    id: user.id,
    username: user.username,
    path: user.path,
    avatar: user.avatar,
    avatarContract: user.avatarContract,
    avatarTokenId: user.avatarTokenId,
    avatarChain: user.avatarChain,
    deletedAt: user.deletedAt
  };
}
