
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
    await prisma.profileItem.createMany({
      data: hiddenProfileItems.map(profileItem => ({
        id: profileItem.id,
        walletAddress: profileItem.walletAddress,
        userId: req.session.user.id,
        isHidden: true,
        type: 'poap'
      }))
    });
  }

  return res.status(200).json({});
}

export default withSessionRoute(handler);
