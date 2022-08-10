import { prisma } from 'db';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { getUserS3Folder, uploadToS3 } from 'lib/aws/uploadToS3Server';
import { onError, onNoMatch } from 'lib/middleware';
import { sessionUserRelations } from 'lib/session/config';
import { SetAvatarRequest } from 'lib/users/interfaces';
import { LoggedInUser } from 'models';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .post(updateAvatar);

async function updateAvatar (req: NextApiRequest, res: NextApiResponse<LoggedInUser | {error: string}>) {
  const { url, tokenId, contractAddress } = req.body as SetAvatarRequest;
  const { id: userId } = req.session.user;
  // TODO - verify if token belongs to the user

  if (!url || !contractAddress || !tokenId) {
    res.status(400).json({ error: 'Invalid avatar data' });
  }

  // TODO: if url points to ipfs:// use gateway
  const { url: avatar } = await uploadToS3({ fileName: getUserS3Folder({ userId, url }), url });

  const user = await prisma.user.update({
    where: {
      id: userId
    },
    include: sessionUserRelations,
    data: {
      avatar,
      avatarContract: contractAddress,
      avatarTokenId: tokenId
    }
  });

  res.status(200).json(user);
}
