export const STATIC_PAGES = [
  { path: 'members', title: 'Member Directory', feature: 'member_directory' },
  { path: 'proposals', title: 'Proposals', feature: 'proposals' },
  { path: 'rewards', title: 'Rewards', feature: 'rewards' },
  { path: 'forum', title: 'Forum', feature: 'forum' }
] as const;

export type StaticPage = (typeof STATIC_PAGES)[number];
export type StaticPageType = StaticPage['path'];

export type Feature = StaticPage['feature'];

export type FeatureJson = {
  id: Feature;
  isHidden: boolean;
  title?: string;
};

export type MappedFeatures = Record<
  Feature,
  {
    id: Feature;
    isHidden: boolean;
    title: string;
    path: StaticPageType;
  }
>;

export const pluralizedSingularizedFeatureTitlesRecord: Record<
  Feature,
  {
    pluralized: string;
    singularized: string;
  }
> = {
  forum: {
    pluralized: 'forums',
    singularized: 'forum'
  },
  member_directory: {
    pluralized: 'member_directories',
    singularized: 'member_directory'
  },
  proposals: {
    pluralized: 'proposals',
    singularized: 'proposal'
  },
  rewards: {
    pluralized: 'rewards',
    singularized: 'reward'
  }
};
