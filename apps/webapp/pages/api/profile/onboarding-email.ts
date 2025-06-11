import { log } from '@charmverse/core/log';
import type { UserDetails } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { magicLinkEmailCookie } from '@packages/config/constants';
import { sendMagicLink } from '@packages/lib/google/sendMagicLink';
import { registerLoopsContact } from '@packages/lib/loopsEmail/registerLoopsContact';
import { sendSignupEvent as sendLoopSignupEvent } from '@packages/lib/loopsEmail/sendSignupEvent';
import { onError, onNoMatch, requireUser } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { updateUserProfile } from '@packages/users/updateUserProfile';
import Cookies from 'cookies';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { spaceTemplateCookie } from 'components/common/CreateSpaceForm/constants';

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

  const cookies = new Cookies(req, res);

  if (updatedUser.email && updatedUser.emailNewsletter && payload.spaceId) {
    try {
      // retrieve space template used via cookie
      const spaceTemplate = cookies.get(spaceTemplateCookie);

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
  if (updatedUser.email) {
    const verifiedEmail = await prisma.verifiedEmail.count({
      where: {
        email: updatedUser.email
      }
    });
    if (verifiedEmail === 0) {
      // see if user wants to verify their email address for logging in later
      await sendMagicLink({
        spaceId: payload.spaceId,
        to: { email: updatedUser.email, userId: updatedUser.id, displayName: updatedUser.username }
      })
        .then(() => {
          log.info('Sent magic link to verify notification email', { userId: updatedUser.id });
          cookies.set(magicLinkEmailCookie, updatedUser.email, {
            httpOnly: false,
            sameSite: 'strict',
            expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) // 7 days
          });
        })
        .catch((error) => {
          log.warn('Error sending magic link to verify user email', { error, userId: updatedUser.id });
        });
    }
  }
  return res.status(200).end();
}

export default withSessionRoute(handler);
