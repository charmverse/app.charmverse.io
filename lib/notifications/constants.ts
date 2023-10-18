export const notificationGroups = ['card', 'forum', 'documents', 'proposals', 'rewards', 'polls'] as const;

export const bountyNotificationTypes = [
  'application.created',
  'application.approved',
  'application.rejected',
  'submission.created',
  'submission.approved',
  'application.payment_pending',
  'application.payment_completed',
  'suggestion.created'
] as const;

export const proposalNotificationTypes = [
  'start_review',
  'start_discussion',
  'reviewed',
  'needs_review',
  'vote',
  'evaluation_active',
  'evaluation_closed'
] as const;
