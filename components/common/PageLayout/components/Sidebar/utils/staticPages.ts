export type Feature = 'member_directory' | 'proposals' | 'forum' | 'bounties' | 'rewards';

export type FeatureJson = {
  id: Feature;
  isHidden: boolean;
  title?: string;
};

enum StaticPagesPath {
  members = 'members',
  forum = 'forum',
  bounties = 'bounties',
  proposals = 'proposals',
  rewards = 'rewards'
}

export type StaticPagesType = keyof typeof StaticPagesPath;

export type StaticPage = {
  path: StaticPagesType;
  title: string;
  feature: Feature;
};

export const STATIC_PAGES: StaticPage[] = [
  { path: 'members', title: 'Member Directory', feature: 'member_directory' },
  { path: 'proposals', title: 'Proposals', feature: 'proposals' },
  // TODO - Remove this duplicate section once the bounties are fully migrated to the new rewards
  { path: 'bounties', title: 'Bounties', feature: 'bounties' },
  { path: 'rewards', title: 'Rewards', feature: 'rewards' },
  { path: 'forum', title: 'Forum', feature: 'forum' }
];
