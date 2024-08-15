import { getPageInviteEmail } from './emails/emails';
import type { PageInviteEmailProps } from './emails/templates/PageInviteEmail';
import type { EmailRecipient } from './mailer';
import { sendEmail } from './mailer';

export function sendPageInviteEmail({ to, ...variables }: { to: EmailRecipient } & PageInviteEmailProps) {
  const template = getPageInviteEmail(variables);
  return sendEmail({ ...template, to });
}
