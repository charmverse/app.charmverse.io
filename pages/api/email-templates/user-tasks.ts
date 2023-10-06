import nc from 'next-connect';
import { v4 } from 'uuid';

import * as emails from 'lib/mailer/emails/emails';
import { onError, onNoMatch } from 'lib/middleware';
import type {
  BountyNotification,
  DiscussionNotification,
  DocumentNotification,
  PostNotification,
  ProposalNotification,
  VoteNotification
} from 'lib/notifications/interfaces';
import { getPagePath } from 'lib/pages/utils';
import randomName from 'lib/utilities/randomName';
import type { VoteTask } from 'lib/votes/interfaces';

import { templatesContainer } from './page-invite';

const handler = nc({
  onError,
  onNoMatch
});

const createDocumentTask = ({
  pageTitle,
  spaceName,
  mentionText
}: {
  spaceName: string;
  mentionText: string;
  pageTitle: string;
}): DocumentNotification => {
  const id = v4();
  return {
    commentId: null,
    mentionId: id,
    taskId: id,
    createdAt: new Date().toISOString(),
    pageId: v4(),
    spaceId: v4(),
    spaceDomain: randomName(),
    pagePath: getPagePath(),
    spaceName,
    pageTitle,
    text: mentionText,
    inlineCommentId: null,
    type: 'mention.created',
    createdBy: {
      avatarChain: 1,
      avatarContract: null,
      deletedAt: null,
      id: v4(),
      username: 'username',
      avatar: '',
      path: 'username',
      avatarTokenId: null
    },
    pageType: 'page',
    archived: false,
    group: 'document',
    read: false
  };
};

const createPostTask = ({ postTitle, spaceName }: { spaceName: string; postTitle: string }): PostNotification => {
  return {
    spaceId: v4(),
    spaceDomain: randomName(),
    taskId: v4(),
    type: 'created',
    spaceName,
    postId: v4(),
    postTitle,
    postPath: getPagePath(),
    createdAt: new Date().toISOString(),
    createdBy: {
      avatarChain: 1,
      avatarContract: null,
      deletedAt: null,
      id: v4(),
      username: 'username',
      avatar: '',
      path: 'username',
      avatarTokenId: null
    },
    archived: false,
    group: 'post',
    read: false
  };
};

const createVoteTasks = ({
  voteTitle,
  deadline,
  pageTitle,
  spaceName
}: {
  voteTitle: string;
  deadline: VoteTask['deadline'];
  spaceName: string;
  pageTitle: string;
}): VoteNotification => {
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
    title: voteTitle,
    pageTitle,
    spaceName,
    pagePath: getPagePath(),
    spaceDomain: randomName()
  } as any;
};

const createProposalTasks = ({
  pageTitle,
  spaceName,
  status
}: Pick<ProposalNotification, 'status' | 'spaceName' | 'pageTitle'>): ProposalNotification => {
  return {
    type: 'reviewed',
    pagePath: randomName(),
    pageTitle,
    taskId: v4(),
    createdAt: new Date().toISOString(),
    status,
    spaceDomain: randomName(),
    spaceName,
    pageId: v4(),
    spaceId: v4(),
    createdBy: {
      avatarChain: 1,
      avatarContract: null,
      deletedAt: null,
      id: v4(),
      username: 'username',
      avatar: '',
      path: 'username',
      avatarTokenId: null
    },
    archived: false,
    group: 'proposal',
    read: false
  };
};

const createBountyTask = ({
  pageTitle,
  spaceName,
  status
}: Pick<BountyNotification, 'pageTitle' | 'spaceName' | 'status'>): BountyNotification => {
  const id = v4();
  return {
    taskId: id,
    type: 'application.approved',
    pagePath: randomName(),
    pageTitle,
    status,
    spaceDomain: randomName(),
    spaceName,
    pageId: v4(),
    createdAt: new Date().toISOString(),
    applicationId: v4(),
    spaceId: v4(),
    createdBy: {
      avatarChain: 1,
      avatarContract: null,
      deletedAt: null,
      id: v4(),
      username: 'username',
      avatar: '',
      path: 'username',
      avatarTokenId: null
    },
    archived: false,
    group: 'bounty',
    read: false
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
      totalUnreadNotifications: 6,
      bountyNotifications: [
        createBountyTask({
          pageTitle: 'Create a new protocol',
          spaceName: 'Uniswap',
          status: 'open'
        })
      ],
      proposalNotifications: [
        createProposalTasks({
          pageTitle: 'Should Uniswap provide Rage Trade with an additional use grant',
          spaceName: 'Uniswap',
          status: 'discussion'
        }),
        createProposalTasks({
          pageTitle: 'Proposal to add XSTUSD-3CRV to the Gauge Controller',
          spaceName: 'Curve Finance',
          status: 'draft'
        })
      ],
      cardNotifications: [],
      documentNotifications: [
        createDocumentTask({
          mentionText: 'Hey there, please respond to this message.',
          pageTitle: 'Attention please',
          spaceName: 'CharmVerse'
        }),
        createDocumentTask({
          mentionText: 'cc @ghostpepper',
          pageTitle: 'Product Road Map',
          spaceName: 'CharmVerse'
        }),
        createDocumentTask({
          mentionText: "Let's have a meeting @ghostpepper",
          pageTitle: 'Product Discussion',
          spaceName: 'CharmVerse'
        }),
        createDocumentTask({
          mentionText: 'Take a look at this @ghostpepper',
          pageTitle: 'Task Board',
          spaceName: 'CharmVerse'
        }),
        createDocumentTask({
          mentionText: 'We should discuss about this @ghostpepper',
          pageTitle: 'Product Road Map',
          spaceName: 'CharmVerse'
        }),
        createDocumentTask({
          mentionText: 'We are facing issues @ghostpepper',
          pageTitle: 'Product Discussion',
          spaceName: 'CharmVerse'
        })
      ],
      voteNotifications: [
        createVoteTasks({
          deadline: new Date(Date.now() + 12 * 60 * 60 * 1000),
          pageTitle: 'This is a really really long vote title',
          spaceName: 'This is a really really long space name',
          voteTitle:
            'Should we add this section? I think it can be a great addition but need all of your votes to decide'
        }),
        createVoteTasks({
          deadline: new Date(Date.now() + 26 * 60 * 60 * 1000),
          pageTitle: 'Product Discussion',
          spaceName: 'CharmVerse',
          voteTitle: 'Should we format the text?'
        }),
        createVoteTasks({
          deadline: new Date(Date.now() + 32 * 60 * 60 * 1000),
          pageTitle: 'Task Board',
          spaceName: 'CharmVerse',
          voteTitle: "Let's vote"
        }),
        createVoteTasks({
          deadline: new Date(Date.now() + 52 * 60 * 60 * 1000),
          pageTitle: 'Product Road Map',
          spaceName: 'CharmVerse Demo',
          voteTitle: 'We should all vote on this'
        })
      ],
      forumNotifications: [
        createPostTask({
          postTitle: "New idea. Let's discuss!",
          spaceName: 'CharmVerse'
        }),
        createPostTask({
          postTitle: 'Start the new process.',
          spaceName: 'CharmVerse'
        })
      ]
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

export default handler;
