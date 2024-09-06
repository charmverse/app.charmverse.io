import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getSession } from '@connect-shared/lib/session/getSession';
import { redirect } from 'next/navigation';

import { ComingSoon } from 'components/home/ComingSoon';
import { HomePage } from 'components/home/HomePage';

// tell Next that this route loads dynamic data
export const dynamic = 'force-dynamic';

export default async function Home() {
  const session = await getSession();

  if (session?.user?.id) {
    const user = await prisma.scout.findFirst({
      where: {
        id: session.user.id
      }
    });

    if (user) {
      redirect('/profile');
    } else {
      log.warn('User has session that is not found in the db', { userId: session.user.id });
    }
  }

  return <ComingSoon />;
}
