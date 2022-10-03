
import type { ProfileItem } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { UpdateProfileItemRequest } from 'charmClient/apis/profileApi';
import { prisma } from 'db';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .put(updateUserProfileItems);

async function updateUserProfileItems (req: NextApiRequest, res: NextApiResponse<any | { error: string }>) {

  const { profileItems }: UpdateProfileItemRequest = req.body;

  const shownProfileItems: Omit<ProfileItem, 'userId'>[] = [];
  const hiddenProfileItems: Omit<ProfileItem, 'userId'>[] = [];

  profileItems.forEach(profileItem => {
    if (!profileItem.isHidden) {
      shownProfileItems.push(profileItem);
    }
    else {
      hiddenProfileItems.push(profileItem);
    }
  });

  if (shownProfileItems.length) {
    const ids: string[] = shownProfileItems.map((profileItem) => profileItem.id);
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
        userId: req.session.user.id,
        metadata: profileItem.metadata === null ? undefined : profileItem.metadata,
        isHidden: true,
        type: profileItem.type
      }
    })));
  }

  return res.status(200).end();
}

export default withSessionRoute(handler);
