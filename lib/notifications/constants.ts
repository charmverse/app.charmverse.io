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
  'start_discussion',
  'review_required',
  'vote',
  'vote_closed',
  'reward_published',
  'proposal_passed',
  'step_passed',
  'step_failed'
] as const;
