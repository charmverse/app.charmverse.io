import nc from 'next-connect';
import { onError, onNoMatch } from 'lib/middleware';
import * as emails from 'lib/emails/emails';
import { v4 } from 'uuid';
import { MentionedTask } from 'lib/mentions/interfaces';
import randomName from 'lib/utilities/randomName';
import { VoteTask } from 'lib/votes/interfaces';

const handler = nc({
  onError,
  onNoMatch
});

const createMentionTask = ({ pageTitle, spaceName, mentionText }: {spaceName: string, mentionText: string, pageTitle: string}): MentionedTask => {
  return {
    mentionId: v4(),
    createdAt: new Date().toISOString(),
    pageId: v4(),
    spaceId: v4(),
    spaceDomain: randomName(),
    pagePath: `page-${Math.random().toString().replace('0.', '')}`,
    spaceName,
    pageTitle,
    text: mentionText,
    bountyId: null,
    bountyTitle: null,
    commentId: null,
    type: 'page',
    createdBy: {
      id: v4(),
      createdAt: new Date(),
      updatedAt: new Date(),
      addresses: [],
      email: '',
      username: '',
      avatar: '',
      path: '',
      isBot: false,
      identityType: 'Discord'
    }
  };
};

const createVoteTasks = ({ voteTitle, deadline, pageTitle, spaceName }: {voteTitle: string, deadline: VoteTask['deadline'], spaceName: string, pageTitle: string}): VoteTask => {
  return {
    deadline,
    id: v4(),
    page: {
      path: `page-${Math.random().toString().replace('0.', '')}`,
      title: pageTitle
    },
    space: {
      domain: randomName(),
      name: spaceName
    },
    pageId: v4(),
    spaceId: v4(),
    title: voteTitle
  };
};

const templates = {
  'Notify the user about tasks': () => {
    return emails.getPendingTasksEmail({
      user: {
        id: '<userId>',
        email: '<userEmail>',
        username: 'ghostpepper'
      },
      totalTasks: 6,
      mentionedTasks: [
        createMentionTask({
          mentionText: 'cc @ghostpepper',
          pageTitle: 'Product Road Map',
          spaceName: 'CharmVerse'
        }),
        createMentionTask({
          mentionText: 'Let\'s have a meeting @ghostpepper',
          pageTitle: 'Product Discussion',
          spaceName: 'CharmVerse'
        }),
        createMentionTask({
          mentionText: 'Take a look at this @ghostpepper',
          pageTitle: 'Task Board',
          spaceName: 'CharmVerse'
        }),
        createMentionTask({
          mentionText: 'We should discuss about this @ghostpepper',
          pageTitle: 'Product Road Map',
          spaceName: 'CharmVerse'
        })
      ],
      voteTasks: [
        createVoteTasks({
          deadline: new Date(Date.now() + (12 * 60 * 60 * 1000)),
          pageTitle: 'This is a really really long vote title',
          spaceName: 'This is a really really long space name',
          voteTitle: 'Should we add this section? I think it can be a great addition but need all of your votes to decide'
        }),
        createVoteTasks({
          deadline: new Date(Date.now() + (26 * 60 * 60 * 1000)),
          pageTitle: 'Product Discussion',
          spaceName: 'Charmverse',
          voteTitle: 'Should we format the text?'
        }),
        createVoteTasks({
          deadline: new Date(Date.now() + (32 * 60 * 60 * 1000)),
          pageTitle: 'Task Board',
          spaceName: 'Charmverse',
          voteTitle: 'Let\'s vote'
        }),
        createVoteTasks({
          deadline: new Date(Date.now() + (52 * 60 * 60 * 1000)),
          pageTitle: 'Product Road Map',
          spaceName: 'Charmverse Demo',
          voteTitle: 'We should all vote on this'
        })
      ],
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
