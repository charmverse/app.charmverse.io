import type { Scout } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { getSession } from '@connect-shared/lib/session/getSession';
import { replaceS3Domain } from '@root/lib/utils/url';

export type SessionUser = Pick<
  Scout,
  'id' | 'username' | 'displayName' | 'avatar' | 'builderStatus' | 'currentBalance' | 'onboardedAt' | 'agreedToTermsAt'
>;

export async function getUserFromSession(): Promise<SessionUser | null> {
  const session = await getSession();
  if (session?.scoutId) {
    const user = await prisma.scout.findFirst({
      where: {
        id: session.scoutId
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        builderStatus: true,
        currentBalance: true,
        onboardedAt: true,
        agreedToTermsAt: true,
        bio: true
      }
    });

    if (user?.avatar) {
      user.avatar = replaceS3Domain(user.avatar);
    }
    return user;
  }
  return null;
}
