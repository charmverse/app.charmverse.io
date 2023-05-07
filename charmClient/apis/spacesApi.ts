import type { Space } from '@charmverse/core/prisma';

import * as http from 'adapters/http';
import type { SpaceWithGates } from 'lib/spaces/interfaces';
import type { SpaceHiddenFeatures } from 'lib/spaces/setHiddenFeatures';

export class SpacesApi {
  async searchByDomain(search: string) {
    return http.GET<SpaceWithGates | null>('/api/spaces/search-domain', { search });
  }

  async searchByName(search: string) {
    return http.GET<SpaceWithGates[]>('/api/spaces/search-name', { search });
  }

  async setHiddenFeatures({ hiddenFeatures, spaceId }: SpaceHiddenFeatures) {
    return http.POST<Space>(`/api/spaces/${spaceId}/set-hidden-features`, { hiddenFeatures });
  }
}
