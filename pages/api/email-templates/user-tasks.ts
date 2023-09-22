import nc from 'next-connect';
import { v4 } from 'uuid';

import * as emails from 'lib/mailer/emails/emails';
import { onError, onNoMatch } from 'lib/middleware';
import type { BountyTask } from 'lib/notifications/getBountyNotifications';
import type {
  DiscussionNotification,
  ForumNotification,
  ProposalNotification,
  VoteNotification
} from 'lib/notifications/interfaces';
import { getPagePath } from 'lib/pages/utils';
import randomName from 'lib/utilities/randomName';

import { templatesContainer } from './page-invite';

const handler = nc({
  onError,
  onNoMatch
});

const createDiscussionTask = ({
  pageTitle,
  spaceName,
  mentionText,
  pageType = 'page'
}: {
  pageType?: DiscussionNotification['pageType'];
  spaceName: string;
  mentionText: string;
  pageTitle: string;
}): DiscussionNotification => {
  const id = v4();
  return {
    mentionId: id,
    id,
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
    type: 'mention.created',
    createdBy: {
      id: v4(),
      username: '',
      avatar: '',
      path: '',
      avatarTokenId: null,
      avatarChain: 1,
      avatarContract: '0x495f...7b',
      deletedAt: null
    },
    inlineCommentId: null,
    pageType
  };
};

const createForumTask = ({
  postTitle,
  spaceName,
  commentText
}: {
  spaceName: string;
  commentText: string;
  postTitle: string;
}): ForumNotification => {
  return {
    spaceId: v4(),
    spaceDomain: randomName(),
    id: v4(),
    type: 'post.comment.created',
    spaceName,
    postId: v4(),
    postTitle,
    postPath: getPagePath(),
    commentText,
    commentId: v4(),
    createdAt: new Date().toISOString(),
    mentionId: v4(),
    createdBy: {
      id: v4(),
      username: '',
      avatar: '',
      path: '',
      avatarTokenId: null,
      avatarChain: 1,
      avatarContract: '0x495f...7b',
      deletedAt: null
    }
  };
};

const createVoteNotifications = ({
  voteTitle,
  deadline,
  pageTitle,
  spaceName
}: {
  voteTitle: string;
  deadline: VoteNotification['deadline'];
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

const createProposalNotifications = ({
  type,
  pageTitle,
  spaceName,
  status
}: Omit<
  ProposalNotification,
  'id' | 'spaceDomain' | 'pagePath' | 'pageId' | 'createdAt' | 'eventDate' | 'spaceId' | 'createdBy'
>): ProposalNotification => {
  return {
    id: v4(),
    type,
    createdBy: null,
    spaceId: v4(),
    pagePath: randomName(),
    pageTitle,
    createdAt: new Date().toISOString(),
    status,
    spaceDomain: randomName(),
    spaceName,
    pageId: v4()
  };
};

const createBountyTask = ({
  action,
  pageTitle,
  spaceName,
  status
}: Omit<
  BountyTask,
  'id' | 'spaceDomain' | 'pagePath' | 'pageId' | 'eventDate' | 'createdAt' | 'createdBy'
>): BountyTask => {
  const id = v4();
  return {
    id,
    action,
    pagePath: randomName(),
    pageTitle,
    status,
    spaceDomain: randomName(),
    spaceName,
    pageId: v4(),
    eventDate: new Date(),
    createdAt: new Date(),
    createdBy: null
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
      totalNotifications: 6,
      bountyNotifications: [
        createBountyTask({
          action: 'application_pending',
          pageTitle: 'Create a new protocol',
          spaceName: 'Uniswap',
          status: 'open'
        })
      ],
      proposalNotifications: [
        createProposalNotifications({
          type: 'proposal.discuss',
          pageTitle: 'Should Uniswap provide Rage Trade with an additional use grant',
          spaceName: 'Uniswap',
          status: 'discussion'
        }),
        createProposalNotifications({
          type: 'proposal.start_discussion',
          pageTitle: 'Proposal to add XSTUSD-3CRV to the Gauge Controller',
          spaceName: 'Curve Finance',
          status: 'draft'
        })
      ],
      discussionNotifications: [
        createDiscussionTask({
          mentionText: 'Hey there, please respond to this message.',
          pageTitle: 'Attention please',
          spaceName: 'CharmVerse',
          pageType: 'bounty'
        }),
        createDiscussionTask({
          mentionText: 'cc @ghostpepper',
          pageTitle: 'Product Road Map',
          spaceName: 'CharmVerse',
          pageType: 'bounty'
        }),
        createDiscussionTask({
          mentionText: "Let's have a meeting @ghostpepper",
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
        }),
        createDiscussionTask({
          mentionText: 'We are facing issues @ghostpepper',
          pageTitle: 'Product Discussion',
          spaceName: 'CharmVerse'
        })
      ],
      voteNotifications: [
        createVoteNotifications({
          deadline: new Date(Date.now() + 12 * 60 * 60 * 1000),
          pageTitle: 'This is a really really long vote title',
          spaceName: 'This is a really really long space name',
          voteTitle:
            'Should we add this section? I think it can be a great addition but need all of your votes to decide'
        }),
        createVoteNotifications({
          deadline: new Date(Date.now() + 26 * 60 * 60 * 1000),
          pageTitle: 'Product Discussion',
          spaceName: 'CharmVerse',
          voteTitle: 'Should we format the text?'
        }),
        createVoteNotifications({
          deadline: new Date(Date.now() + 32 * 60 * 60 * 1000),
          pageTitle: 'Task Board',
          spaceName: 'CharmVerse',
          voteTitle: "Let's vote"
        }),
        createVoteNotifications({
          deadline: new Date(Date.now() + 52 * 60 * 60 * 1000),
          pageTitle: 'Product Road Map',
          spaceName: 'CharmVerse Demo',
          voteTitle: 'We should all vote on this'
        })
      ],
      forumNotifications: [
        createForumTask({
          postTitle: "New idea. Let's discuss!",
          commentText: 'Great idea. Keep it up',
          spaceName: 'CharmVerse'
        }),
        createForumTask({
          postTitle: 'Start the new process.',
          commentText: 'Let us have a meeting regarding this topic',
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
