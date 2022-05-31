import nc from 'next-connect';
import { onError, onNoMatch } from 'lib/middleware';
import * as emails from 'lib/emails/emails';

const handler = nc({
  onError,
  onNoMatch
});

const templates = {
  'Notify the user about tasks': () => {
    return emails.getPendingTasksEmail({
      tasks: [{
        tasks: [],
        safeAddress: '0x123',
        safeName: null,
        safeUrl: 'https://app.charmverse.io'
      }]
    });
  }
};

handler.get(async (req, res) => {

  const renderedEmails = Object.entries(templates).map(([description, output]) => ({
    ...output(),
    description
  }));

  const tpl = `
    <h1 style="background: white; padding: 40px 20px">
      <div style="max-width: 1024px; margin: 0 auto">Email Templates</div>
    </h1>
    ${renderedEmails.map(({ description, subject, html }) => `
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
      <div style="margin-bottom: 20px">${html}</div>`).join('<hr>')}
  `;

  const wrapped = wrapHtml(tpl);

  res.status(200).send(wrapped);

});

function wrapHtml (html: string) {
  return `<html><head><meta charset="UTF-8"></head><body style="background: #eee; font-size: 13px; font-family: arial,sans-serif">${html}</body></html>`;
}

export default handler;
