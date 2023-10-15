import nc from 'next-connect';
import { v4 } from 'uuid';

import * as emails from 'lib/mailer/emails/emails';
import { onError, onNoMatch } from 'lib/middleware';
import type {
  BountyNotification,
  CardNotification,
  DocumentNotification,
  PostNotification,
  ProposalNotification,
  VoteNotification
} from 'lib/notifications/interfaces';
import { getPagePath } from 'lib/pages/utils';
import { createDocumentWithText } from 'lib/prosemirror/constants';
import randomName from 'lib/utilities/randomName';
import type { VoteTask } from 'lib/votes/interfaces';

import { templatesContainer } from './page-invite';

const handler = nc({
  onError,
  onNoMatch
});

const dummyUser = {
  avatarChain: 1,
  avatarContract: null,
  deletedAt: null,
  id: v4(),
  username: 'John Doe',
  avatar: '',
  path: 'John Doe',
  avatarTokenId: null
};

const createDocumentNotification = ({
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
    id,
    createdAt: new Date().toISOString(),
    pageId: v4(),
    spaceId: v4(),
    spaceDomain: randomName(),
    pagePath: getPagePath(),
    spaceName,
    pageTitle,
    content: createDocumentWithText(mentionText),
    inlineCommentId: null,
    type: 'mention.created',
    createdBy: dummyUser,
    pageType: 'page',
    archived: false,
    group: 'document',
    read: false
  };
};

const createCardNotification = ({
  pageTitle,
  spaceName
}: {
  spaceName: string;
  pageTitle: string;
}): CardNotification => {
  const id = v4();
  return {
    id,
    createdAt: new Date().toISOString(),
    pageId: v4(),
    spaceId: v4(),
    spaceDomain: randomName(),
    pagePath: getPagePath(),
    spaceName,
    pageTitle,
    type: 'person_assigned',
    createdBy: dummyUser,
    personPropertyId: v4(),
    archived: false,
    group: 'card',
    read: false
  };
};

const createPostNotification = ({
  postTitle,
  spaceName
}: {
  spaceName: string;
  postTitle: string;
}): PostNotification => {
  return {
    spaceId: v4(),
    spaceDomain: randomName(),
    id: v4(),
    type: 'created',
    spaceName,
    postId: v4(),
    postTitle,
    postPath: getPagePath(),
    createdAt: new Date().toISOString(),
    createdBy: dummyUser,
    archived: false,
    group: 'post',
    read: false
  };
};

const createVoteNotification = ({
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
    pageType: 'page',
    archived: false,
    categoryId: v4(),
    createdAt: new Date().toISOString(),
    createdBy: dummyUser,
    group: 'vote',
    read: false,
    status: 'InProgress',
    type: 'new_vote',
    userChoice: null,
    voteId: v4(),
    spaceId: v4(),
    title: voteTitle,
    pageTitle,
    spaceName,
    pagePath: getPagePath(),
    spaceDomain: randomName()
  };
};

const createProposalNotification = ({
  pageTitle,
  spaceName,
  status
}: Pick<ProposalNotification, 'status' | 'spaceName' | 'pageTitle'>): ProposalNotification => {
  return {
    type: 'reviewed',
    pagePath: randomName(),
    pageTitle,
    id: v4(),
    createdAt: new Date().toISOString(),
    status,
    spaceDomain: randomName(),
    spaceName,
    pageId: v4(),
    spaceId: v4(),
    createdBy: dummyUser,
    archived: false,
    group: 'proposal',
    read: false
  };
};

const createBountyNotification = ({
  pageTitle,
  spaceName,
  status
}: Pick<BountyNotification, 'pageTitle' | 'spaceName' | 'status'>): BountyNotification => {
  const id = v4();
  return {
    id,
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
    createdBy: dummyUser,
    archived: false,
    group: 'bounty',
    read: false
  };
};

const templates = {
  'Notify the user about notifications': () => {
    return emails.getPendingNotificationsEmail({
      user: {
        id: '<userId>',
        email: '<userEmail>',
        username: 'ghostpepper'
      },
      totalUnreadNotifications: 6,
      bountyNotifications: [
        createBountyNotification({
          pageTitle: 'Create a new protocol',
          spaceName: 'Uniswap',
          status: 'open'
        })
      ],
      proposalNotifications: [
        createProposalNotification({
          pageTitle: 'Should Uniswap provide Rage Trade with an additional use grant',
          spaceName: 'Uniswap',
          status: 'discussion'
        }),
        createProposalNotification({
          pageTitle: 'Proposal to add XSTUSD-3CRV to the Gauge Controller',
          spaceName: 'Curve Finance',
          status: 'draft'
        })
      ],
      cardNotifications: [
        createCardNotification({
          pageTitle: 'Product Road Map',
          spaceName: 'CharmVerse'
        })
      ],
      documentNotifications: [
        createDocumentNotification({
          mentionText: 'Hey there, please respond to this message.',
          pageTitle: 'Attention please',
          spaceName: 'CharmVerse'
        }),
        createDocumentNotification({
          mentionText: 'cc @ghostpepper',
          pageTitle: 'Product Road Map',
          spaceName: 'CharmVerse'
        }),
        createDocumentNotification({
          mentionText: "Let's have a meeting @ghostpepper",
          pageTitle: 'Product Discussion',
          spaceName: 'CharmVerse'
        }),
        createDocumentNotification({
          mentionText: 'Take a look at this @ghostpepper',
          pageTitle: 'Task Board',
          spaceName: 'CharmVerse'
        }),
        createDocumentNotification({
          mentionText: 'We should discuss about this @ghostpepper',
          pageTitle: 'Product Road Map',
          spaceName: 'CharmVerse'
        }),
        createDocumentNotification({
          mentionText: 'We are facing issues @ghostpepper',
          pageTitle: 'Product Discussion',
          spaceName: 'CharmVerse'
        })
      ],
      voteNotifications: [
        createVoteNotification({
          deadline: new Date(Date.now() + 12 * 60 * 60 * 1000),
          pageTitle: 'This is a really really long vote title',
          spaceName: 'This is a really really long space name',
          voteTitle:
            'Should we add this section? I think it can be a great addition but need all of your votes to decide'
        }),
        createVoteNotification({
          deadline: new Date(Date.now() + 26 * 60 * 60 * 1000),
          pageTitle: 'Product Discussion',
          spaceName: 'CharmVerse',
          voteTitle: 'Should we format the text?'
        }),
        createVoteNotification({
          deadline: new Date(Date.now() + 32 * 60 * 60 * 1000),
          pageTitle: 'Task Board',
          spaceName: 'CharmVerse',
          voteTitle: "Let's vote"
        }),
        createVoteNotification({
          deadline: new Date(Date.now() + 52 * 60 * 60 * 1000),
          pageTitle: 'Product Road Map',
          spaceName: 'CharmVerse Demo',
          voteTitle: 'We should all vote on this'
        })
      ],
      forumNotifications: [
        createPostNotification({
          postTitle: "New idea. Let's discuss!",
          spaceName: 'CharmVerse'
        }),
        createPostNotification({
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
