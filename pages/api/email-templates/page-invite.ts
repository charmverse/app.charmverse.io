import nc from 'next-connect';

import * as emails from 'lib/mailer/emails/emails';
import { onError, onNoMatch } from 'lib/middleware';
import { blueColor } from 'theme/colors';

const handler = nc({
  onError,
  onNoMatch
});

const templates = {
  'Guest added': () => {
    return emails.getPageInviteEmail({
      guestEmail: 'matt.blockchain',
      invitingUserName: 'momakes.blockchain',
      pageTitle: 'Acme Inc proposal',
      pageId: '12344553',
      emailBranding: {
        artwork: '',
        color: blueColor
      }
    });
  }
};

handler.get(async (req, res) => {
  const renderedEmails = Object.entries(templates).map(([description, output]) => ({
    ...output(),
    description
  }));

  const wrapped = templatesContainer(renderedEmails);

  res.status(200).send(wrapped);
});

export function templatesContainer(examples: { description: string; subject: string; html: string }[]) {
  return `
    <html>
      <head><meta charset="UTF-8"></head>
      <body style="font-size: 13px; font-family: arial,sans-serif">
      <h1 style="background: white; padding: 40px 20px">
        <div style="max-width: 1024px; margin: 0 auto">
          Email Templates
          <hr style="border-color: #eee" />
        </div>
      </h1>
      ${examples
        .map(
          ({ description, subject, html }) => `
        <div style="margin: 20px">
          <div style="max-width: 1024px; margin: 0 auto">
            <h2>
              Template: ${description}
            </h2>
            <h3>
              Email Subject: ${subject}
            </h3>
          </div>
        </div>
        <div style="margin-bottom: 20px">${html}</div>`
        )
        .join('<hr>')}
      </body>
    </html>
  `;
}

export default handler;
