import nc from 'next-connect';
import { v4 } from 'uuid';

import type { BountyTask } from 'lib/bounties/getBountyTasks';
import type { DiscussionTask } from 'lib/discussion/interfaces';
import * as emails from 'lib/emails/emails';
import type { ForumTask } from 'lib/forums/getForumNotifications/getForumNotifications';
import { onError, onNoMatch } from 'lib/middleware';
import { getPagePath } from 'lib/pages/utils';
import type { ProposalTask } from 'lib/proposal/getProposalStatusChangeTasks';
import randomName from 'lib/utilities/randomName';
import type { VoteTask } from 'lib/votes/interfaces';

const handler = nc({
  onError,
  onNoMatch
});

const createDiscussionTask = ({
  pageTitle,
  spaceName,
  mentionText,
  type = 'page'
}: {
  type?: DiscussionTask['type'];
  spaceName: string;
  mentionText: string;
  pageTitle: string;
}): DiscussionTask => {
  const id = v4();
  return {
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
    bountyId: null,
    bountyTitle: null,
    commentId: null,
    type,
    createdBy: {
      id: v4(),
      username: '',
      avatar: '',
      path: '',
      avatarTokenId: null
    }
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
}): ForumTask => {
  return {
    spaceId: v4(),
    spaceDomain: randomName(),
    taskId: v4(),
    taskType: 'forum_post',
    spaceName,
    postId: v4(),
    postTitle,
    postPath: `/forum/post/${getPagePath()}`,
    commentText,
    commentId: v4(),
    createdAt: new Date().toISOString(),
    mentionId: v4(),
    createdBy: {
      id: v4(),
      username: '',
      avatar: '',
      path: '',
      avatarTokenId: null
    }
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
}): VoteTask => {
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

const createProposalTasks = ({
  action,
  pageTitle,
  spaceName,
  status
}: Omit<
  ProposalTask,
  'id' | 'taskId' | 'spaceDomain' | 'pagePath' | 'pageId' | 'createdAt' | 'eventDate'
>): ProposalTask => {
  return {
    id: v4(),
    action,
    pagePath: randomName(),
    pageTitle,
    taskId: v4(),
    eventDate: new Date(),
    createdAt: new Date(),
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
  'id' | 'spaceDomain' | 'pagePath' | 'pageId' | 'eventDate' | 'taskId' | 'createdAt' | 'createdBy'
>): BountyTask => {
  const id = v4();
  return {
    id,
    taskId: id,
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
  'Guest added': () => {
    return emails.getAddedAsGuestEmail({
      action: 'edit',
      invitingUserName: 'momakes.blockchain',
      pageTitle: 'Acme Inc proposal'
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
    ${renderedEmails
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
  `;

  const wrapped = wrapHtml(tpl);

  res.status(200).send(wrapped);
});

function wrapHtml(html: string) {
  return `<html><head><meta charset="UTF-8"></head><body style="font-size: 13px; font-family: arial,sans-serif">${html}</body></html>`;
}

export default handler;
