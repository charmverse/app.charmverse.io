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

export type MappedFeature = {
  id: Feature;
  isHidden: boolean;
  title: string;
  path: StaticPageType;
};

export type FeatureMap = Record<Feature, MappedFeature>;
