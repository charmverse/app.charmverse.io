import { prisma } from '@charmverse/core/prisma-client';
import admin from 'firebase-admin';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

import { googleFirebaseAdminConfig } from 'config/constants';
import { getMagicLinkEmail } from 'lib/mailer/emails';
import type { EmailRecipient } from 'lib/mailer/mailer';
import { sendEmail } from 'lib/mailer/mailer';

type MagicLinkDispatch = {
  to: EmailRecipient;
  redirectUrl?: string;
  spaceId?: string; // for branding
};

// manage credentials https://console.firebase.google.com/u/1/project/charmverse-dev/settings/serviceaccounts/adminsdk

export async function sendMagicLink({ to, redirectUrl, spaceId }: MagicLinkDispatch) {
  if (
    !googleFirebaseAdminConfig.privateKey ||
    !googleFirebaseAdminConfig.clientEmail ||
    !googleFirebaseAdminConfig.projectId
  ) {
    throw new Error('Missing auth info for Firebase');
  }
  // make sure we only initialize the app once
  const alreadyCreatedApps = getApps();
  const firebaseClientApp =
    alreadyCreatedApps.length === 0
      ? initializeApp({ credential: admin.credential.cert(googleFirebaseAdminConfig) })
      : alreadyCreatedApps[0];

  const actionCodeSettings = {
    url: `${process.env.DOMAIN}/authenticate${redirectUrl ? `?redirectUrl=${encodeURIComponent(redirectUrl)}` : ''}`,
    handleCodeInApp: true
  };
  const magicLink = await getAuth(firebaseClientApp).generateEmailVerificationLink(to.email, actionCodeSettings);

  const space = spaceId
    ? await prisma.space.findUnique({
        where: {
          id: spaceId
        }
      })
    : null;
  const template = getMagicLinkEmail({
    magicLink,
    emailBranding: {
      artwork: space?.emailBrandArtwork || '',
      color: space?.emailBrandColor || ''
    }
  });
  return sendEmail({
    to,
    subject: template.subject,
    html: template.html
  });
}
