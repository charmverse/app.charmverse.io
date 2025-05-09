import { prisma } from '@charmverse/core/prisma-client';
import admin from 'firebase-admin';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

import { googleFirebaseAdminConfig } from '@packages/config/constants';
import { getMagicLinkEmail } from '@packages/lib/mailer/emails';
import type { EmailRecipient } from '@packages/lib/mailer/mailer';
import { sendEmail } from '@packages/lib/mailer/mailer';

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
  const firebase = getAuth(firebaseClientApp);
  const user = await firebase.getUserByEmail(to.email).catch(() => null); // this method throws if user does not exist
  // create a firebase user or else generateEmailVerificationLink will fail
  if (!user) {
    await firebase.createUser({ email: to.email });
  }
  // we use SignIn link since it redirects user to our site, whereas generateEmailVerificationLink drops them at a firebase page by default.
  const magicLink = await firebase.generateSignInWithEmailLink(to.email, actionCodeSettings);

  const space = spaceId
    ? await prisma.space.findUnique({
        where: {
          id: spaceId
        }
      })
    : null;
  const template = await getMagicLinkEmail({
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
