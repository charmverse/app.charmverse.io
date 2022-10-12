import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import getENSName from 'lib/blockchain/getENSName';
import type { DiscordAccount } from 'lib/discord/getDiscordAccount';
import { InvalidStateError, onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { shortenHex } from 'lib/utilities/strings';
import type { IdentityType } from 'models';
import { IDENTITY_TYPES } from 'models';

const handler = nc({
  onError,
  onNoMatch
});

handler.use(requireUser).post(disconnectTelegram);

async function disconnectTelegram (req: NextApiRequest, res: NextApiResponse) {
  await prisma.telegramUser.delete({
    where: {
      userId: req.session.user.id
    }
  });

  const user = await prisma.user.findUnique({
    where: {
      id: req.session.user.id
    },
    include: {
      discordUser: true,
      wallets: true
    }
  });

  if (!user) {
    return res.status(400).json({
      error: 'User does not exist'
    });
  }

  // If identity type is not Telegram
  if (user.identityType !== IDENTITY_TYPES[2]) {
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
  if (user.discordUser
    && user.discordUser.account
    && (user.discordUser.account as Partial<DiscordAccount>).username
  ) {
    const discordAccount = user.discordUser.account as Partial<DiscordAccount>;
    // Already checked that there is a username
    newUserName = discordAccount.username || '';
    newIdentityProvider = IDENTITY_TYPES[1];
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
