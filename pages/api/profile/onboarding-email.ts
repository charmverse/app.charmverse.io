import { log } from '@charmverse/core/log';
import type { UserDetails } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import Cookies from 'cookies';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { registerLoopUser } from 'lib/loop/loopClient';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { updateUserProfile } from 'lib/users/updateUserProfile';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).put(saveOnboardingEmail);

export type EmailPreferences = {
  email?: string;
  emailNewsletter?: boolean;
  emailNotifications?: boolean;
  spaceId?: string; // the current space id
};

async function saveOnboardingEmail(req: NextApiRequest, res: NextApiResponse<UserDetails | { error: string }>) {
  const payload = req.body as EmailPreferences;
  const { id: userId } = req.session.user;
  const cookies = new Cookies(req, res);
  const spaceTemplateCookie = cookies.get('spaceTemplateUsed');

  const updatedUser = await updateUserProfile(userId, req.body);

  if (updatedUser.email && updatedUser.emailNewsletter && payload.spaceId) {
    try {
      const space = await prisma.space.findUniqueOrThrow({
        where: {
          id: payload.spaceId
        }
      });
      const isAdmin = updatedUser.spaceRoles.some((role) => role.spaceId === payload.spaceId && role.isAdmin);
      registerLoopUser({
        isAdmin,
        space,
        spaceTemplate: spaceTemplateCookie,
        user: updatedUser
      });
    } catch (error) {
      log.error('Could not register user with Loop', { error, userId });
    }
  }
  return res.status(200);
}

export default withSessionRoute(handler);
