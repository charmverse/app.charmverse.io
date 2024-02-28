export const TRANSACTIONS_PAGE_SIZE = 20;

export enum CharmActionTrigger {
  'referral' = 'referral',
  'referralReferee' = 'referralReferee'
  // TODO: add more types like createPage, createSpace, etc.
}

export const charmActionRewards: Record<CharmActionTrigger, number> = {
  [CharmActionTrigger.referral]: 5,
  [CharmActionTrigger.referralReferee]: 10
};
