import type { Feature } from '@prisma/client';

export enum StaticPagesPath {
  members = 'members',
  forum = 'forum',
  bounties = 'bounties',
  proposals = 'proposals'
}

export type StaticPagesType = `${StaticPagesPath}`;

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
