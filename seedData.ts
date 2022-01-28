import { Contributor, Page, Space } from 'models';

export const spaces: Space[] = [
  { id: '0', name: 'Our Community', domain: 'demo' },
  { id: '1', name: 'My Workspace', domain: 'my-workspace' },
];

export const contributors: Contributor[] = [
  { id: '0', address: '0x87ddfh6g435D12CE393aBbA3f81fe6C594543sdw', favorites: [], username: 'dolemite', spaceRoles: [{ spaceId: spaces[0].id, type: 'admin', userId: '0' }, { spaceId: spaces[1].id, type: 'admin', userId: '0' }] },
  { id: '1', address: '0x1416d1b5435D12CE393aBbA3f81fe6C5951e4Bf4', favorites: [], username: 'cerberus', spaceRoles: [{ spaceId: spaces[0].id, type: 'admin', userId: '1' }] },
  { id: '2', address: '0x626a827c90AA620CFD78A8ecda494Edb9a4225D5', favorites: [], username: 'devorein', spaceRoles: [{ spaceId: spaces[0].id, type: 'contributor', userId: '2' }, { spaceId: spaces[1].id, type: 'admin', userId: '2' }] },
  { id: '3', address: '0x66525057AC951a0DB5C9fa7fAC6E056D6b8997E2', favorites: [], username: 'mattopoly', spaceRoles: [{ spaceId: spaces[1].id, type: 'contributor', userId: '3' }] }
];

export const activeUser = contributors[0];

export const pages: Page[] = [
  { id: '0', created: new Date(), content: 'Testing... 1, 2, 3...', isPublic: false, path: '', spaceId: '0', title: 'First Page' },
  { id: '1', created: new Date(), content: 'Hello world :)', isPublic: false, path: '', spaceId: '0', title: 'Second Page' }
];