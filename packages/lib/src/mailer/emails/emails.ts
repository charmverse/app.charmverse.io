import type { User } from '@charmverse/core/prisma-client';
import type { FeatureJson } from '@packages/features/constants';
import { getNotificationMetadata } from '@packages/lib/notifications/getNotificationMetadata';
import type { Notification } from '@packages/lib/notifications/interfaces';
import { render } from '@react-email/render';
import { htmlToText } from 'html-to-text';
import type { ReactElement } from 'react';
import ReactDOMServer from 'react-dom/server';

import type { MagicLinkProps } from './templates/MagicLinkTemplate';
import { emailSubject as emailVerificationSubject, MagicLinkTemplate } from './templates/MagicLinkTemplate';
import { NotificationTemplate } from './templates/NotificationTemplate';
import { OrangeDAOInviteTemplate } from './templates/OrangeDAOInviteTemplate';
import type { PageInviteEmailProps } from './templates/PageInviteTemplate';
import { emailSubject, PageInviteTemplate } from './templates/PageInviteTemplate';
import { PlainTemplate } from './templates/PlainTemplate';
import type { PricingChangeEmailProps } from './templates/PricingChangeTemplate';
import { emailPricingChangeSubject, PricingChangeTemplate } from './templates/PricingChangeTemplate';

export async function getPendingNotificationEmail({
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
  const html = await render(NotificationTemplate({ emailBranding, notification, user, spaceFeatures }));
  const content = getNotificationMetadata({ notification, spaceFeatures }).content;
  const subject =
    typeof content === 'string' ? content : htmlToText(ReactDOMServer.renderToString(content as ReactElement));

  return { html, subject };
}

export async function getOrangeDaoSpaceInviteEmail({
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
  const html = await render(
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

export async function getPageInviteEmail(props: PageInviteEmailProps) {
  const html = await render(PageInviteTemplate(props));
  const subject = emailSubject(props);

  return { html, subject };
}

export async function getMagicLinkEmail(props: MagicLinkProps) {
  const html = await render(MagicLinkTemplate(props));
  const subject = emailVerificationSubject();

  return { html, subject };
}

export function getPlainEmail({ html, subject }: { html: string | string[]; subject: string }) {
  return render(PlainTemplate({ html, subject }));
}

export async function getPricingChangeEmail(props: PricingChangeEmailProps) {
  const html = await render(PricingChangeTemplate(props));
  const subject = emailPricingChangeSubject(props);

  return { html, subject };
}
