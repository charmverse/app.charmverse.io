import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import getENSName from 'lib/blockchain/getENSName';
import { InvalidStateError, onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { shortenHex } from 'lib/utilities/strings';
import type { IdentityType } from 'models';
import { IDENTITY_TYPES } from 'models';
import type { TelegramAccount } from 'pages/api/telegram/connect';

const handler = nc({
  onError,
  onNoMatch
});

handler.use(requireUser).post(disconnectDiscord);

async function disconnectDiscord (req: NextApiRequest, res: NextApiResponse) {
  const user = await prisma.user.findUnique({
    where: {
      id: req.session.user.id
    },
    include: {
      telegramUser: true,
      wallets: true
    }
  });

  if (!user) {
    return res.status(400).json({
      error: 'Invalid user id'
    });
  }

  if (user.wallets.length === 0) {
    return res.status(400).json({
      error: 'You must have at least a single address'
    });
  }

  await prisma.discordUser.delete({
    where: {
      userId: req.session.user.id
    }
  });

  // If identity type is not Discord
  if (user.identityType !== IDENTITY_TYPES[1]) {
    return res.status(200).json({ success: 'ok' });
  }

  let newUserName: string;
  let newIdentityProvider: IdentityType;

  let ens: string | null = null;
  if (user.wallets[0]?.address) {
    ens = await getENSName(user.wallets[0].address);
  }

  if (ens) {
    newUserName = ens;
    newIdentityProvider = IDENTITY_TYPES[0];
  }
  else if (user.telegramUser) {
    const telegramAccount = user.telegramUser.account as Partial<TelegramAccount>;
    newUserName = telegramAccount.username || `${telegramAccount.first_name} ${telegramAccount.last_name}`;
    newIdentityProvider = IDENTITY_TYPES[2];
  }
  else if (user.wallets.length) {
    newUserName = shortenHex(user.wallets[0].address);
    newIdentityProvider = IDENTITY_TYPES[0];
  }
  else {
    throw new InvalidStateError();
  }

  const updatedUser = await prisma.user.update({
    where: {
      id: req.session.user.id
    },
    data: {
      username: newUserName,
      identityType: newIdentityProvider
    }
  });

  return res.status(200).json(updatedUser);
}

export default withSessionRoute(handler);
