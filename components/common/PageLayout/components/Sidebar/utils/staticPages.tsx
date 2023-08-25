export type Feature = 'member_directory' | 'proposals' | 'forum' | 'bounties';

export type FeatureJson = {
  id: Feature;
  isHidden: boolean;
  title?: string;
};

enum StaticPagesPath {
  members = 'members',
  forum = 'forum',
  bounties = 'bounties',
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
  { path: 'bounties', title: 'Bounties', feature: 'bounties' },
  { path: 'forum', title: 'Forum', feature: 'forum' }
];
