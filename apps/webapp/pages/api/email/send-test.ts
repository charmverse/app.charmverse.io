import { prisma } from '@charmverse/core/prisma-client';
import { charmBlue as blueColor } from '@packages/config/colors';
import { InvalidInputError, UnauthorisedActionError } from '@packages/core/errors';
import type { FeatureJson } from '@packages/features/constants';
import * as mailer from '@packages/lib/mailer';
import * as emails from '@packages/lib/mailer/emails';
import { getMemberUsernameBySpaceRole } from '@packages/lib/members/getMemberUsername';
import { onError, onNoMatch, requireUser } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { hasAccessToSpace } from '@packages/users/hasAccessToSpace';
import { isValidEmail } from '@packages/utils/strings';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { v4 } from 'uuid';

const handler = nc({
  onError,
  onNoMatch
});

export interface SendTestEmailPayload {
  email: string;
  spaceId: string;
}

async function sendTestEmail(req: NextApiRequest, res: NextApiResponse) {
  const { email, spaceId } = req.body as SendTestEmailPayload;
  const userId = req.session.user.id;

  if (!isValidEmail(email)) {
    throw new InvalidInputError('Invalid email');
  }

  const { isAdmin } = await hasAccessToSpace({
    spaceId,
    userId
  });

  if (!isAdmin) {
    throw new UnauthorisedActionError();
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: {
      id: userId
    },
    select: {
      id: true,
      username: true,
      avatar: true
    }
  });

  const space = await prisma.space.findUniqueOrThrow({
    where: {
      id: spaceId
    },
    select: {
      domain: true,
      name: true,
      emailBrandArtwork: true,
      emailBrandColor: true,
      features: true,
      spaceRoles: {
        where: {
          userId
        }
      }
    }
  });

  const spaceRoleId = space.spaceRoles[0].id;

  const primaryIdentity = await getMemberUsernameBySpaceRole({ spaceRoleId });

  const template = await emails.getPendingNotificationEmail({
    notification: {
      id: v4(),
      archived: false,
      spaceId,
      group: 'proposal',
      pageId: v4(),
      pagePath: 'test',
      pageTitle: 'Test Proposal',
      previousEvaluation: null,
      read: false,
      spaceDomain: space.domain,
      spaceName: space.name,
      type: 'proposal_published',
      createdAt: new Date().toISOString(),
      status: 'published',
      evaluation: {
        title: 'Feedback'
      },
      createdBy: {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        avatarChain: null,
        avatarContract: null,
        avatarTokenId: null,
        deletedAt: null,
        path: ''
      }
    },
    user: { ...user, username: primaryIdentity },
    spaceFeatures: (space.features ?? []) as FeatureJson[],
    emailBranding: {
      artwork: space.emailBrandArtwork || '',
      color: space.emailBrandColor || blueColor
    }
  });

  await mailer.sendEmail({
    to: {
      displayName: user.username,
      email,
      userId: user.id
    },
    subject: template.subject,
    html: template.html
  });

  res.status(200).end();
}

handler.use(requireUser).post(sendTestEmail);

export default withSessionRoute(handler);
