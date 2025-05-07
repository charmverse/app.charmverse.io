import { getPageInviteEmail } from './emails/emails';
import type { PageInviteEmailProps } from './emails/templates/PageInviteTemplate';
import type { EmailRecipient } from './mailer';
import { sendEmail } from './mailer';

export async function sendPageInviteEmail({ to, ...variables }: { to: EmailRecipient } & PageInviteEmailProps) {
  const template = await getPageInviteEmail(variables);
  return sendEmail({ ...template, to });
}
