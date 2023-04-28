import type { Feature } from '@charmverse/core/dist/prisma';

export enum StaticPagesPath {
  members = 'members',
  forum = 'forum',
  bounties = 'bounties',
  proposals = 'proposals'
}

export type StaticPagesType = keyof typeof StaticPagesPath;

export type StaticPagesList = {
  path: StaticPagesType;
  title: string;
  feature: Feature;
};

export const STATIC_PAGES: StaticPagesList[] = [
  { path: 'members', title: 'Member Directory', feature: 'member_directory' },
  { path: 'proposals', title: 'Proposals', feature: 'proposals' },
  { path: 'bounties', title: 'Bounties', feature: 'bounties' },
  { path: 'forum', title: 'Forum', feature: 'forum' }
];
