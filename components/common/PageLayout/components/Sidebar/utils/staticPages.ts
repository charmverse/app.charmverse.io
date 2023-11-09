export type Feature = 'member_directory' | 'proposals' | 'forum' | 'rewards' | 'bounties';

export type FeatureJson = {
  id: Feature;
  isHidden: boolean;
  title?: string;
};

enum StaticPagesPath {
  members = 'members',
  forum = 'forum',
  // This is still included for backwards compatibility
  // TODO: [bounties-cleanup]
  // bounties = 'bounties',
  rewards = 'rewards',
  proposals = 'proposals'
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
  // TODO: [bounties-cleanup]
  // { path: 'bounties', title: 'Bounties', feature: 'bounties' },
  { path: 'rewards', title: 'Rewards', feature: 'rewards' },
  { path: 'forum', title: 'Forum', feature: 'forum' }
];
