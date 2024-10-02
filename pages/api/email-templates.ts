import type { User } from '@charmverse/core/prisma-client';
import { charmBlue as blueColor } from '@root/config/colors';
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
import { randomName } from 'lib/utils/randomName';
import type { VoteTask } from 'lib/votes/interfaces';

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
    applicationCommentId: null,
    applicationId: null,
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
    personProperty: {
      id: v4(),
      name: 'Assignee'
    },
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
    type: 'proposal_passed',
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
    read: false,
    evaluation: {
      title: 'Review'
    },
    previousEvaluation: {
      title: 'Feedback'
    }
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

const user: Pick<User, 'id' | 'avatar' | 'username' | 'email'> = {
  id: v4(),
  avatar: '',
  username: 'Doe John',
  email: 'doejohn@gmail.com'
};

const templates = {
  'Notify the user about reward notifications': () => {
    return emails.getPendingNotificationEmail({
      notification: createBountyNotification({
        pageTitle: 'Create a new protocol',
        spaceName: 'Uniswap',
        status: 'open'
      }),
      user,
      spaceFeatures: [
        {
          id: 'rewards',
          isHidden: false,
          title: 'Rewards'
        }
      ]
    });
  },
  'Notify the user about proposal notifications': () => {
    return emails.getPendingNotificationEmail({
      notification: createProposalNotification({
        pageTitle: 'Should Uniswap provide Rage Trade with an additional use grant',
        spaceName: 'Uniswap',
        status: 'published'
      }),
      user,
      spaceFeatures: []
    });
  },
  'Notify the user about card notifications': () => {
    return emails.getPendingNotificationEmail({
      notification: createCardNotification({
        pageTitle: 'Product Road Map',
        spaceName: 'CharmVerse'
      }),
      user,
      spaceFeatures: []
    });
  },
  'Notify the user about document notifications': () => {
    return emails.getPendingNotificationEmail({
      notification: createDocumentNotification({
        mentionText: 'Hey there, please respond to this message.',
        pageTitle: 'Attention please',
        spaceName: 'CharmVerse'
      }),
      user,
      spaceFeatures: []
    });
  },
  'Notify the user about post notifications': () => {
    return emails.getPendingNotificationEmail({
      notification: createPostNotification({
        postTitle: 'New idea. Let us discuss!',
        spaceName: 'CharmVerse'
      }),
      user,
      spaceFeatures: []
    });
  },
  'Notify the user about vote notifications': () => {
    return emails.getPendingNotificationEmail({
      notification: createVoteNotification({
        deadline: new Date(Date.now() + 12 * 60 * 60 * 1000),
        pageTitle: 'This is a really really long vote title',
        spaceName: 'CharmVerse',
        voteTitle: 'Should we add this section? I think it can be a great addition but need all of your votes to decide'
      }),
      user,
      spaceFeatures: []
    });
  },
  'Notify the user about OrangeDAO invite notifications': () => {
    return emails.getOrangeDaoSpaceInviteEmail({
      pagePath: 'orange-dao',
      pageTitle: 'OrangeDAO fellowship',
      spaceDomain: 'orange-dao',
      spaceName: 'OrangeDAO',
      user
    });
  },
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
  },
  'Email verification': () => {
    return emails.getMagicLinkEmail({
      magicLink: 'https://apps.com'
    });
  }
};

handler.get(async (req, res) => {
  const renderedEmails = await Promise.all(
    Object.entries(templates).map(async ([description, output]) => ({
      ...(await output()),
      description
    }))
  );

  const wrapped = templatesContainer(renderedEmails);

  res.status(200).send(wrapped);
});

function templatesContainer(examples: { description: string; subject: string; html: string }[]) {
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
