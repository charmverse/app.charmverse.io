import type { Page, ProfileItem } from '@prisma/client';
import * as http from 'adapters/http';
import type { IPageWithPermissions, PageDetails } from 'lib/pages';

export interface UpdateProfileItemRequest {
  profileItems: Omit<ProfileItem, 'userId'>[];
}

export class PagesApi {
  getPage (pageIdOrPath: string, spaceId?:string) {
    return http.GET<IPageWithPermissions>(`/api/pages/${pageIdOrPath}?spaceId=${spaceId}`);
  }

  updatePage (pageOpts: Partial<Page>) {
    return http.PUT<IPageWithPermissions>(`/api/pages/${pageOpts.id}`, pageOpts);
  }

  getPageDetails (pageIdOrPath: string, spaceId?:string) {
    return http.GET<PageDetails>(`/api/pages/${pageIdOrPath}/details?spaceId=${spaceId}`);
  }
}

