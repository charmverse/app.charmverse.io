import nc from 'next-connect';
import { v4 } from 'uuid';

import type { BountyTask } from 'lib/bounties/getBountyTasks';
import type { DiscussionTask } from 'lib/discussion/interfaces';
import * as emails from 'lib/emails/emails';
import { onError, onNoMatch } from 'lib/middleware';
import { getPagePath } from 'lib/pages/utils';
import type { ProposalTask } from 'lib/proposal/getProposalTasksFromWorkspaceEvents';
import randomName from 'lib/utilities/randomName';
import type { VoteTask } from 'lib/votes/interfaces';

const handler = nc({
  onError,
  onNoMatch
});

const createDiscussionTask = (
  { pageTitle, spaceName, mentionText }: { spaceName: string, mentionText: string, pageTitle: string }
): DiscussionTask => {
  return {
    mentionId: v4(),
    createdAt: new Date().toISOString(),
    pageId: v4(),
    spaceId: v4(),
    spaceDomain: randomName(),
    pagePath: getPagePath(),
    spaceName,
    pageTitle,
    text: mentionText,
    bountyId: null,
    bountyTitle: null,
    commentId: null,
    type: 'page',
    createdBy: {
      addresses: [],
      id: v4(),
      createdAt: new Date(),
      updatedAt: new Date(),
      email: '',
      username: '',
      avatar: '',
      path: '',
      isBot: false,
      identityType: 'Discord',
      avatarContract: null,
      avatarTokenId: null,
      avatarChain: null,
      deletedAt: null
    }
  };
};

const createVoteTasks = ({ voteTitle, deadline, pageTitle, spaceName }: { voteTitle: string, deadline: VoteTask['deadline'], spaceName: string, pageTitle: string }): VoteTask => {
  return {
    deadline,
    id: v4(),
    page: {
      path: getPagePath(),
      title: pageTitle
    } as any,
    space: {
      domain: randomName(),
      name: spaceName
    } as any,
    pageId: v4(),
    spaceId: v4(),
    title: voteTitle
  } as any;
};

const createProposalTasks = ({ action, pageTitle, spaceName, status }: Omit<ProposalTask, 'id' | 'spaceDomain' | 'pagePath' | 'pageId'>): ProposalTask => {
  return {
    id: v4(),
    action,
    pagePath: randomName(),
    pageTitle,
    status,
    spaceDomain: randomName(),
    spaceName,
    pageId: v4()
  };
};

const createBountyTask = ({ action, pageTitle, spaceName, status }: Omit<BountyTask, 'id' | 'spaceDomain' | 'pagePath' | 'pageId' | 'eventDate'>): BountyTask => {
  return {
    id: v4(),
    action,
    pagePath: randomName(),
    pageTitle,
    status,
    spaceDomain: randomName(),
    spaceName,
    pageId: v4(),
    eventDate: new Date()
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
      bountyTasks: [
        createBountyTask({
          action: 'application_pending',
          pageTitle: 'Create a new protocol',
          spaceName: 'Uniswap',
          status: 'open'
        })
      ],
      proposalTasks: [
        createProposalTasks({
          action: 'discuss',
          pageTitle: 'Should Uniswap provide Rage Trade with an additional use grant',
          spaceName: 'Uniswap',
          status: 'discussion'
        }),
        createProposalTasks({
          action: 'start_discussion',
          pageTitle: 'Proposal to add XSTUSD-3CRV to the Gauge Controller',
          spaceName: 'Curve Finance',
          status: 'private_draft'
        })
      ],
      discussionTasks: [
        createDiscussionTask({
          mentionText: 'Hey there, please respond to this message.',
          pageTitle: 'Attention please',
          spaceName: 'CharmVerse'
        }),
        createDiscussionTask({
          mentionText: 'cc @ghostpepper',
          pageTitle: 'Product Road Map',
          spaceName: 'CharmVerse'
        }),
        createDiscussionTask({
          mentionText: 'Let\'s have a meeting @ghostpepper',
          pageTitle: 'Product Discussion',
          spaceName: 'CharmVerse'
        }),
        createDiscussionTask({
          mentionText: 'Take a look at this @ghostpepper',
          pageTitle: 'Task Board',
          spaceName: 'CharmVerse'
        }),
        createDiscussionTask({
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
          spaceName: 'CharmVerse',
          voteTitle: 'Should we format the text?'
        }),
        createVoteTasks({
          deadline: new Date(Date.now() + (32 * 60 * 60 * 1000)),
          pageTitle: 'Task Board',
          spaceName: 'CharmVerse',
          voteTitle: 'Let\'s vote'
        }),
        createVoteTasks({
          deadline: new Date(Date.now() + (52 * 60 * 60 * 1000)),
          pageTitle: 'Product Road Map',
          spaceName: 'CharmVerse Demo',
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
              snoozedUsers: [],
              safeChainId: 1
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
              snoozedUsers: [],
              safeChainId: 1
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
