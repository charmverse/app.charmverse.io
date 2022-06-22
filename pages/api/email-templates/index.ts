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
      user: {
        id: '<userId>',
        email: '<userEmail>',
        username: 'ghostpepper'
      },
      totalTasks: 5,
      mentionedTasks: [{
        mentionId: '5c9dcbc4-34ee-4acc-bfb5-a1ed7d36ec57',
        createdAt: '2022-06-20T16:34:10.378Z',
        pageId: 'a92c5abb-f4ea-4b68-b598-29fa020c888e',
        spaceId: '3d87bdb9-69e9-4243-a198-e9087e8e67e9',
        spaceDomain: 'agreeable-harlequin-whale',
        pagePath: 'page-7165406800388272',
        spaceName: 'agreeable-harlequin-whale',
        pageTitle: 'Space 2 Page 1',
        text: 'Mention inside @b1c173…8e29 callout',
        createdBy: {
          id: 'b1c1735e-da3c-4856-bd7c-fa9b13978e29',
          createdAt: new Date('2022-06-18T16:17:36'),
          updatedAt: new Date('2022-06-18T16:17:36'),
          addresses: ['0xb1b9FFF08F3827875F91ddE929036a65f2A5d27d', '0x865c2f85c9fea1c6ac7f53de07554d68cb92ed88', '0x8d07d225a769b7af3a923481e1fdf49180e6a265'],
          email: 'reinforz.xyz@gmail.com',
          username: 'Devorein',
          avatar: 'https://s3.amazonaws.com/charm.public.test/user-content/b1c1735e-da3c-4856-bd7c-fa9b13978e29/91bd9695-3fc9-4641-9597-1bca71646f0f/6866c3f39e2382f979a99b4e9e6ec9b4.png',
          path: 'devorein',
          isBot: false,
          identityType: 'Discord'
        }
      }, {
        mentionId: 'da4b78aa-94d5-4587-a269-9eb586ddec76',
        createdAt: '2022-06-20T16:33:43.370Z',
        pageId: '07c2b5c8-32e1-4830-ba65-8d12f0d3f2b7',
        spaceId: '7ff83973-5076-45a7-a22d-83470179e61e',
        spaceDomain: 'economic-dapp-bug',
        pagePath: 'page-7413812249702414',
        spaceName: 'economic-dapp-bug',
        pageTitle: 'Space 1 Page 1',
        text: 'Text surrounding @b1c173…8e29 Mention',
        createdBy: {
          id: 'b1c1735e-da3c-4856-bd7c-fa9b13978e29',
          createdAt: new Date('2022-06-18T16:17:36'),
          updatedAt: new Date('2022-06-18T16:17:36'),
          addresses: ['0xb1b9FFF08F3827875F91ddE929036a65f2A5d27d', '0x865c2f85c9fea1c6ac7f53de07554d68cb92ed88', '0x8d07d225a769b7af3a923481e1fdf49180e6a265'],
          email: 'reinforz.xyz@gmail.com',
          username: 'Devorein',
          avatar: 'https://s3.amazonaws.com/charm.public.test/user-content/b1c1735e-da3c-4856-bd7c-fa9b13978e29/91bd9695-3fc9-4641-9597-1bca71646f0f/6866c3f39e2382f979a99b4e9e6ec9b4.png',
          path: 'devorein',
          isBot: false,
          identityType: 'Discord'
        }
      }],
      gnosisSafeTasks: [
        {
          tasks: [{
            nonce: 3,
            transactions: [{
              id: '123',
              actions: [],
              date: new Date().toISOString(),
              confirmations: [],
              isExecuted: false,
              description: 'Send .02 ETH',
              gnosisUrl: 'https://gnosis.com',
              myAction: 'Sign',
              myActionUrl: 'https://gnosis.com',
              nonce: 3,
              safeAddress: '0x66525057AC951a0DB5C9fa7fAC6E056D6b8997E2',
              safeName: 'My Personal Safe',
              threshold: 2,
              snoozedUsers: []
            }]
          }],
          safeAddress: '0x123',
          safeName: 'My Personal Safe',
          safeUrl: 'https://app.charmverse.io',
          taskId: '1'
        },
        {
          tasks: [{
            nonce: 7,
            transactions: [{
              id: '123',
              actions: [],
              date: new Date().toISOString(),
              confirmations: [],
              isExecuted: false,
              description: 'Send 10 ETH',
              gnosisUrl: 'https://gnosis.com',
              myAction: 'Sign',
              myActionUrl: 'https://gnosis.com',
              nonce: 7,
              safeAddress: '0x66525057AC951a0DB5C9fa7fAC6E056D6b8997E2',
              safeName: 'Work Safe',
              threshold: 2,
              snoozedUsers: []
            }]
          }],
          safeAddress: '0x456',
          safeName: 'Work Safe',
          safeUrl: 'https://app.charmverse.io',
          taskId: '2'
        }
      ]
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
      <div style="max-width: 1024px; margin: 0 auto">
        Email Templates
        <hr style="border-color: #eee" />
      </div>
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
  return `<html><head><meta charset="UTF-8"></head><body style="font-size: 13px; font-family: arial,sans-serif">${html}</body></html>`;
}

export default handler;
