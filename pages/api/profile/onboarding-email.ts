import { log } from '@charmverse/core/log';
import type { UserDetails } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import Cookies from 'cookies';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { spaceTemplateCookie } from 'components/common/CreateSpaceForm/constants';
import { registerLoopsContact } from 'lib/loopsEmail/registerLoopsContact';
import { sendSignupEvent as sendLoopSignupEvent } from 'lib/loopsEmail/sendSignupEvent';
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

  const updatedUser = await updateUserProfile(userId, payload);

  if (updatedUser.email && updatedUser.emailNewsletter && payload.spaceId) {
    try {
      // retrieve space template used via cookie
      const spaceTemplate = new Cookies(req, res).get(spaceTemplateCookie);

      const space = await prisma.space.findUniqueOrThrow({
        where: {
          id: payload.spaceId
        }
      });
      const isAdmin = updatedUser.spaceRoles.some((role) => role.spaceId === payload.spaceId && role.isAdmin);
      const result = await registerLoopsContact(updatedUser);
      if (result.isNewContact) {
        await sendLoopSignupEvent({
          email: updatedUser.email,
          isAdmin,
          spaceName: space.name,
          spaceTemplate
        });
        log.info('Sent signup to Loop', { userId });
      }
    } catch (error) {
      log.error('Could not register user with Loop', { error, userId });
    }
  }
  return res.status(200).end();
}

export default withSessionRoute(handler);
