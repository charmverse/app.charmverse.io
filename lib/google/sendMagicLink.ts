import { googleWebClientConfig } from '@root/config/constants';
import admin from 'firebase-admin';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

import { googleFirebaseAdminConfig } from 'config/constants';
import { getEmailVerification } from 'lib/mailer/emails';
import type { EmailRecipient } from 'lib/mailer/mailer';
import { sendEmail } from 'lib/mailer/mailer';

type MagicLinkDispatch = {
  to: EmailRecipient;
  redirectUrl?: string;
};

// manage credentials https://console.firebase.google.com/u/1/project/charmverse-dev/settings/serviceaccounts/adminsdk

export async function sendMagicLink({ to, redirectUrl }: MagicLinkDispatch) {
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
  const verificationUrl = await getAuth(firebaseClientApp).generateEmailVerificationLink(to.email, actionCodeSettings);

  const template = getEmailVerification({
    verificationUrl
    // emailBranding: {
    //   artwork: space.emailBrandArtwork || '',
    //   color: space.emailBrandColor || blueColor
    // }
  });
  return sendEmail({
    to,
    subject: template.subject,
    html: template.html
  });
}
