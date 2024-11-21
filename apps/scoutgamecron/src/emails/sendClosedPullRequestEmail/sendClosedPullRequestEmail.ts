import { log } from '@charmverse/core/log';
import { sendEmail } from '@packages/mailer/mailer';
import { render } from '@react-email/render';

import { ClosedPullRequestTemplate } from './ClosedPullRequestTemplate';

export async function sendClosedPullRequestEmail({
  currentStrikesCount,
  pullRequestLink,
  userId,
  email
}: {
  pullRequestLink: string;
  currentStrikesCount: number;
  userId: string;
  email: string;
}) {
  try {
    const html = await render(ClosedPullRequestTemplate({ pullRequestLink, currentStrikesCount }));
    await sendEmail({
      to: {
        email,
        displayName: 'The Scout Game',
        userId
      },
      senderAddress: `The Scout Game <updates@mail.scoutgame.xyz>`,
      subject: 'Scout Game Alert: ⚠️',
      html
    });
  } catch (error) {
    log.error('Error sending closed pull request email', { error });
  }
}
