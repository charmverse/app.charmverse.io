import type { Space } from '@prisma/client';

import * as http from 'adapters/http';
import type { SpaceWithGates } from 'lib/spaces/interfaces';
import type { SpaceFeatureBlacklist } from 'lib/spaces/setFeatureBlacklist';

export class SpacesApi {
  async searchByDomain(search: string) {
    return http.GET<SpaceWithGates | null>('/api/spaces/search-domain', { search });
  }

  async searchByName(search: string) {
    return http.GET<SpaceWithGates[]>('/api/spaces/search-name', { search });
  }

  async setFeatureBlacklist({ featureBlacklist, spaceId }: SpaceFeatureBlacklist) {
    return http.POST<Space>(`/api/spaces/${spaceId}/set-feature-blacklist`, { featureBlacklist });
  }
}
