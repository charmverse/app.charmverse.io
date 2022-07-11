
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { verifyJwt } from 'lit-js-sdk';
import { prisma } from 'db';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import log from 'lib/log';
import { postToDiscord } from 'lib/log/userEvents';
import { Space } from '@prisma/client';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(verifyWallet);

async function verifyWallet (req: NextApiRequest, res: NextApiResponse) {

  const tokenGateId = req.query.id as string;
  const user = req.session.user;
  const { jwt } = req.body;

  const tokenGate = await prisma.tokenGate.findFirst({
    where: { id: tokenGateId }
  });

  if (!tokenGate) {
    res.status(404).json({ error: 'Token gate not found' });
    return;
  }

  try {
    const result = await verifyJwt({ jwt });
    if (!result.verified) {
      log.warn('Could not verify wallet', { userId: user.id, result });
      throw new Error('This wallet could not be verified');
    }
    if (req.body.commit) {
      const spaceRole = await prisma.spaceRole.findFirst({
        where: {
          userId: user.id,
          spaceId: tokenGate.spaceId
        }
      });
      const tokenGateToRoles = await prisma.tokenGateToRole.findMany({
        where: {
          tokenGateId
        }
      });

      if (!spaceRole) {
        const createdSpaceRole = await prisma.spaceRole.create({
          data: {
            isAdmin: false,
            userId: user.id,
            spaceId: tokenGate.spaceId,
            tokenGateId: tokenGate.id,
            tokenGateConnectedDate: new Date()
          }
        });

        const { name: workspaceName } = await prisma.space.findUnique({
          where: {
            id: tokenGate.spaceId
          }
        }) as Space;

        logWorkspaceJoinedViaTokenGate(workspaceName);

        await prisma.spaceRoleToRole.createMany({
          data: tokenGateToRoles.map(tokenGateToRole => ({
            roleId: tokenGateToRole.roleId,
            spaceRoleId: createdSpaceRole.id
          }))
        });
        log.debug('Gave user access to workspace', { tokenGateId: tokenGate.id, userId: user.id });

      }
    }
    const space = await prisma.space.findFirst({
      where: { id: tokenGate.spaceId }
    });

    res.status(200).json({ space, success: result.verified });
  }
  catch (err) {
    res.status(200).json({ error: (<Error> err).message });
  }
}

export default withSessionRoute(handler);

export async function logWorkspaceJoinedViaTokenGate (workspaceName: string) {
  postToDiscord({
    funnelStage: 'acquisition',
    eventType: 'create_user',
    message: `A user has joined the ${workspaceName} workspace via token gate.`
  });
}
