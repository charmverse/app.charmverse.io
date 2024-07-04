import type { User } from '@charmverse/core/prisma-client';
import { render } from '@react-email/render';
import { htmlToText } from 'html-to-text';
import type { ReactElement } from 'react';
import ReactDOMServer from 'react-dom/server';

import type { FeatureJson } from 'lib/features/constants';
import { getNotificationMetadata } from 'lib/notifications/getNotificationMetadata';
import type { Notification } from 'lib/notifications/interfaces';

import type { EmailVerificationProps } from './templates/EmailVerificationTemplate';
import {
  emailSubject as emailVerificationSubject,
  EmailVerificationTemplate
} from './templates/EmailVerificationTemplate';
import { NotificationTemplate } from './templates/NotificationTemplate';
import { OrangeDAOInviteTemplate } from './templates/OrangeDAOInviteTemplate';
import type { PageInviteEmailProps } from './templates/PageInviteTemplate';
import { emailSubject, PageInviteTemplate } from './templates/PageInviteTemplate';

export function getPendingNotificationEmail({
  notification,
  spaceFeatures,
  user,
  emailBranding
}: {
  notification: Notification;
  user: Pick<User, 'username' | 'id' | 'avatar'>;
  spaceFeatures: FeatureJson[];
  emailBranding?: {
    artwork: string;
    color: string;
  };
}) {
  const html = render(NotificationTemplate({ emailBranding, notification, user, spaceFeatures }));
  const content = getNotificationMetadata({ notification, spaceFeatures }).content;
  const subject =
    typeof content === 'string' ? content : htmlToText(ReactDOMServer.renderToString(content as ReactElement));

  return { html, subject };
}

export function getOrangeDaoSpaceInviteEmail({
  pagePath,
  pageTitle,
  spaceDomain,
  user,
  spaceName
}: {
  spaceName: string;
  pageTitle: string;
  pagePath: string;
  spaceDomain: string;
  user: Pick<User, 'username' | 'id' | 'avatar'>;
}) {
  const html = render(
    OrangeDAOInviteTemplate({
      pagePath,
      pageTitle,
      spaceDomain,
      user,
      spaceName
    })
  );
  const subject = 'OrangeDAO fellowship invites you';

  return {
    html,
    subject
  };
}

export function getPageInviteEmail(props: PageInviteEmailProps) {
  const html = render(PageInviteTemplate(props));
  const subject = emailSubject(props);

  return { html, subject };
}

export function getEmailVerification(props: EmailVerificationProps) {
  const html = render(EmailVerificationTemplate(props));
  const subject = emailVerificationSubject();

  return { html, subject };
}
