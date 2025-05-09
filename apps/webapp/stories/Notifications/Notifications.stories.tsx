import { Divider, Grid, Paper, Typography } from '@mui/material';
import { bountyNotificationTypes, proposalNotificationTypes } from '@packages/lib/notifications/constants';
import type {
  BountyNotification,
  CardNotification,
  DocumentNotification,
  Notification,
  PostNotification,
  NotificationActor,
  ProposalNotification,
  VoteNotification
} from '@packages/lib/notifications/interfaces';
import { getCurrentDate } from '@packages/lib/utils/dates';
import { Fragment } from 'react';
import { v4 as uuid } from 'uuid';

import { NotificationContent } from 'components/common/PageLayout/components/Sidebar/components/NotificationsPopover';

import { members } from '../lib/mockData';

const baseFields: Omit<Notification, 'group' | 'type'> = {
  createdAt: getCurrentDate().toISOString(),
  createdBy: { avatarContract: null, avatarChain: null, ...members[0] } as NotificationActor,
  id: '_',
  spaceDomain: 'cv_house',
  spaceName: 'CV House',
  spaceId: '_',
  read: true,
  archived: false
};

const documents: DocumentNotification[] = [
  {
    type: 'comment.created' as const
  },
  {
    type: 'comment.replied' as const
  },
  {
    type: 'comment.mention.created' as const
  },
  {
    type: 'inline_comment.created' as const
  },
  {
    type: 'inline_comment.replied' as const
  },
  {
    type: 'inline_comment.mention.created' as const
  },
  {
    type: 'application_comment.created' as const
  },
  {
    type: 'application_comment.replied' as const
  },
  {
    type: 'application_comment.mention.created' as const
  },
  {
    type: 'mention.created' as const
  }
].map((notification) => ({
  ...baseFields,
  applicationCommentId: '_',
  applicationId: '_',
  content: null,
  group: 'document' as const,
  commentId: '_',
  inlineCommentId: '_',
  mentionId: '_',
  pageId: '_',
  pagePath: '/path',
  pageTitle: 'Test page',
  pageType: 'page' as const,
  ...notification
}));

const forum: PostNotification[] = [
  {
    type: 'created',
    personPropertyId: '_',
    group: 'post',
    postId: '_',
    postPath: '/post',
    postTitle: 'Test post'
  }
].map((notification) => ({ ...baseFields, ...notification }) as PostNotification);

const cards: CardNotification[] = [
  {
    pageId: '_',
    pagePath: '/card',
    pageTitle: 'Test card',
    type: 'person_assigned' as const,
    personProperty: {
      id: '_',
      name: 'John Doe'
    },
    group: 'card' as const
  }
].map((notification) => ({ ...baseFields, ...notification }));

const bounties: BountyNotification[] = bountyNotificationTypes
  .map((type) => ({ type, group: 'bounty' as const }))
  .concat({
    type: 'suggestion.created' as const,
    group: 'bounty' as const
  })
  .map((notification) => ({
    ...baseFields,
    applicationId: '_',
    status: 'suggestion' as const,
    pageId: '_',
    pagePath: '/bounty',
    pageTitle: 'Test bounty',
    ...notification
  }));

const polls: VoteNotification[] = [
  {
    status: 'InProgress' as const,
    pagePath: '/vote',
    pageTitle: 'Vacation ideas',
    pageType: 'page' as const,
    categoryId: null,
    title: 'Vote on a hotel',
    deadline: getCurrentDate(),
    voteId: '_',
    type: 'new_vote' as const,
    userChoice: null,
    personPropertyId: '_',
    group: 'vote' as const
  }
].map((notification) => ({ ...baseFields, ...notification, id: uuid() }));

const proposals: ProposalNotification[] = proposalNotificationTypes
  .map((type) => ({
    type,
    group: 'proposal' as const,
    pageId: '_',
    pagePath: '/proposal',
    pageTitle: 'Test proposal',
    status: 'published' as const,
    evaluation: {
      title: 'Review'
    },
    previousEvaluation: {
      title: 'Feedback'
    }
  }))
  .map((notification) => ({ ...baseFields, ...notification, id: uuid() }));

const groups = [
  {
    title: 'Documents',
    notifications: documents
  },
  {
    title: 'Cards',
    notifications: cards
  },
  {
    title: 'Forum',
    notifications: forum
  },
  {
    title: 'Polls',
    notifications: polls
  },
  {
    title: 'Rewards',
    notifications: bounties
  },
  {
    title: 'Proposals',
    notifications: proposals
  }
];

const noop = () => Promise.resolve();

export function NotificationTypes() {
  return (
    // <Context>
    <Paper sx={{ p: 4 }}>
      <Typography mb={2}>
        The following is an example of each type of notification message the system can produce
      </Typography>
      {groups.map(({ title, notifications }) => (
        <Fragment key={title}>
          <Typography variant='h6' my={2}>
            {title}
          </Typography>
          <Grid container columnSpacing={4}>
            {notifications.map((notification) => (
              <Grid item xs={12} md={6} key={notification.id}>
                <NotificationContent
                  notification={notification}
                  markNotifications={noop}
                  onClose={noop}
                  actorUsername={notification.createdBy.username}
                />
                <Divider />
              </Grid>
            ))}
          </Grid>
        </Fragment>
      ))}
    </Paper>
    // </Context>
  );
}

export default {
  title: 'Notifications/NotificationTypes',
  component: NotificationTypes
};
