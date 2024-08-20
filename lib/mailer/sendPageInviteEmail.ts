import { getPageInviteEmail } from './emails/emails';
import type { PageInviteEmailProps } from './emails/templates/PageInviteTemplate';
import type { EmailRecipient } from './mailer';
import { sendEmail } from './mailer';

export function sendPageInviteEmail({ to, ...variables }: { to: EmailRecipient } & PageInviteEmailProps) {
  const template = getPageInviteEmail(variables);
  return sendEmail({ ...template, to });
}
