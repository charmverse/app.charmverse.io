
import { ProfileItemType } from '@prisma/client';
import { prisma } from 'db';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { UpdateProfileItemRequest } from 'lib/profileItem/interfaces';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .put(updateUserProfileItems);

async function updateUserProfileItems (req: NextApiRequest, res: NextApiResponse<any | {error: string}>) {

  const { shownProfileItems, hiddenProfileItems }: UpdateProfileItemRequest = req.body;

  if (shownProfileItems.length) {
    const ids: string[] = shownProfileItems.map((profileItem) => profileItem.id || '');
    await prisma.profileItem.updateMany({
      where: {
        id: {
          in: ids
        }
      },
      data: {
        isHidden: false
      }
    });
  }

  if (hiddenProfileItems.length) {
    await Promise.all(hiddenProfileItems.map(profileItem => prisma.profileItem.upsert({
      where: {
        id: profileItem.id
      },
      update: {
        id: profileItem.id,
        isHidden: true
      },
      create: {
        id: profileItem.id,
        walletAddress: profileItem.walletAddress,
        userId: req.session.user.id,
        metadata: profileItem.metadata === null ? undefined : profileItem.metadata,
        isHidden: true,
        type: 'poap' as ProfileItemType
      }
    })));
  }

  return res.status(200).json({});
}

export default withSessionRoute(handler);
