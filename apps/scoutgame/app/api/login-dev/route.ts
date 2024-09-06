import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import { getIronOptions } from '@connect-shared/lib/session/config';
import { cookieName } from '@root/config/constants';
import { randomIntFromInterval } from '@root/lib/utils/random';
import { sealData } from 'iron-session';

const isTestEnv = process.env.REACT_APP_APP_ENV === 'test';

const demoAvatar =
  'https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=168/https%3A%2F%2Fapp.charmverse.io%2Ffavicon.png';

export async function GET(request: Request) {
  if (!isTestEnv) {
    return new Response('This endpoint is only available in test environment', { status: 403 });
  }

  const { searchParams } = new URL(request.url);

  const userId = searchParams.get('userId');

  if (!userId) {
    const newUserId = await testUtilsUser.generateUser().then((user) => user.id);

    const randomInt = randomIntFromInterval(1, 1000000);

    await prisma.scout.update({
      where: {
        id: newUserId
      },
      data: {
        username: `demo-${randomInt}`,
        avatar: demoAvatar
      }
    });

    await prisma.farcasterUser.create({
      data: {
        fid: randomInt,
        userId: newUserId,
        account: {
          username: `example-user-${randomInt}`,
          displayName: `display-${randomInt}`,
          bio: 'dev user',
          pfpUrl: demoAvatar
        }
      }
    });

    const sealedSession = await sealData({ user: { id: newUserId } }, getIronOptions());

    const response = new Response();

    response.headers.set('Set-Cookie', `${cookieName}=${sealedSession}; HttpOnly; Secure; SameSite=Strict; Path=/`);

    return response;
  } else {
    const user = await prisma.scout.findFirstOrThrow({
      where: {
        id: userId
      },
      select: {
        id: true
      }
    });

    const sealedSession = await sealData({ user: { id: user.id } }, getIronOptions());

    const response = new Response();

    response.headers.set('Set-Cookie', `${cookieName}=${sealedSession}; HttpOnly; Secure; SameSite=Strict; Path=/`);

    return response;
  }
}
