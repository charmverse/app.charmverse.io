import type { Page, ProfileItem } from '@prisma/client';

import * as http from 'adapters/http';
import type { IPageWithPermissions, PageDetails, PageMeta } from 'lib/pages';

export interface UpdateProfileItemRequest {
  profileItems: Omit<ProfileItem, 'userId'>[];
}

export class PagesApi {
  getPages (spaceId: string) {
    // meta=true - TEMP param to keep backward compatibility with old clients
    return http.GET<PageMeta[]>(`/api/spaces/${spaceId}/pages`, { meta: true });
  }

  searchPages (spaceId: string, search: string) {
    // meta=true - TEMP param to keep backward compatibility with old clients
    return http.GET<PageMeta[]>(`/api/spaces/${spaceId}/pages`, { meta: true, search });
  }

  getPage (pageIdOrPath: string, spaceId?: string) {
    const query = spaceId ? `?spaceId=${spaceId}` : '';
    return http.GET<IPageWithPermissions>(`/api/pages/${pageIdOrPath}${query}`);
  }

  updatePage (pageOpts: Partial<Page>) {
    return http.PUT<IPageWithPermissions>(`/api/pages/${pageOpts.id}`, pageOpts);
  }

  getPageDetails (pageIdOrPath: string, spaceId?: string) {
    const query = spaceId ? `?spaceId=${spaceId}` : '';
    return http.GET<PageDetails>(`/api/pages/${pageIdOrPath}/details${query}`);
  }
}

