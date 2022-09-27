import type { ProfileItem } from '@prisma/client';
import * as http from 'adapters/http';
import type { IPageWithPermissions } from 'lib/pages';

export interface UpdateProfileItemRequest {
  profileItems: Omit<ProfileItem, 'userId'>[];
}

export class PagesApi {
  getPage (pageIdOrPath: string, spaceId?:string) {
    return http.GET<IPageWithPermissions>(`/api/pages/${pageIdOrPath}?spaceId=${spaceId}`);
  }

  getPageDetails (pageIdOrPath: string, spaceId?:string) {
    return http.GET<IPageWithPermissions>(`/api/pages/${pageIdOrPath}/details?spaceId=${spaceId}`);
  }
}

