/* eslint-disable class-methods-use-this */

import { Space, Prisma, Page } from '@prisma/client';
import * as http from 'adapters/http';
import { Contributor, LoggedInUser } from 'models';
import type { Response as CheckDomainResponse } from 'pages/api/spaces/checkDomain';

//
// CharmClient is the client interface to the server APIs
//
class CharmClient {

  async login (address: string) {
    const user = await http.POST<LoggedInUser>('/api/session/login', {
      address
    });
    return user;
  }

  async logout () {
    await http.POST('/api/session/logout');
  }

  getUser () {
    return http.GET<LoggedInUser>('/api/profile');
  }

  createUser ({ address }: { address: string }) {
    return http.POST<LoggedInUser>('/api/profile', {
      address
    });
  }

  async createSpace (spaceOpts: Prisma.SpaceCreateInput) {
    const space = await http.POST<Space>('/api/spaces', spaceOpts);
    return space;
  }

  deleteSpace (spaceId: string) {
    return http.DELETE(`/api/spaces/${spaceId}`);
  }

  updateSpace (spaceOpts: Prisma.SpaceUpdateInput) {
    return http.PUT<Space>(`/api/spaces/${spaceOpts.id}`, spaceOpts);
  }

  getSpaces () {
    return http.GET<Space[]>('/api/spaces');
  }

  checkDomain (params: { spaceId?: string, domain: string }) {
    return http.GET<CheckDomainResponse>('/api/spaces/checkDomain', params);
  }

  getPages (spaceId: string) {
    return http.GET<Page[]>(`/api/spaces/${spaceId}/pages`);
  }

  createPage (pageOpts: Prisma.PageCreateInput) {
    return http.POST<Page>('/api/pages', pageOpts);
  }

  deletePage (pageId: string) {
    return http.DELETE(`/api/pages/${pageId}`);
  }

  updatePage (pageOpts: Prisma.PageUpdateInput) {
    return http.PUT<Page>(`/api/pages/${pageOpts.id}`, pageOpts);
  }

  favoritePage (pageId: string) {
    return http.POST('/api/profile/favorites', { pageId });
  }

  unfavoritePage (pageId: string) {
    return http.DELETE('/api/profile/favorites', { pageId });
  }

  getContributors (spaceId: string) {
    return http.GET<Contributor[]>(`/api/spaces/${spaceId}/contributors`);
  }

}

const charmClient = new CharmClient();

export default charmClient;
