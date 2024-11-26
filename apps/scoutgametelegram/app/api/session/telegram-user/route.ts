import { DataNotFoundError } from '@charmverse/core/errors';
import { trackUserAction } from '@packages/mixpanel/trackUserAction';
import { findOrCreateTelegramUser } from '@packages/scoutgame/users/findOrCreateTelegramUser';

import { getSession } from 'lib/session/getSession';
import { validateTelegramData } from 'lib/telegram/validate';

export async function POST(request: Request) {
  const body = await request.json();
  const initData = body.initData;

  const validatedData = validateTelegramData(initData, { expiresIn: 3600 });

  if (!validatedData.user?.id) {
    throw new DataNotFoundError('No telegram user id found');
  }

  const user = await findOrCreateTelegramUser({
    ...validatedData.user,
    start_param: validatedData?.start_param
  });

  const session = await getSession();
  session.scoutId = user?.id;
  session.anonymousUserId = undefined;
  await session.save();

  if (user.isNew) {
    trackUserAction('sign_up', {
      userId: user.id
    });
  } else {
    trackUserAction('sign_in', {
      userId: user.id
    });
  }

  return Response.json(validatedData);
}
