import * as http from 'adapters/http';
import type { SpaceWithGates } from 'lib/spaces/interfaces';

export class SpacesApi {
  async searchByDomain(search: string) {
    return http.GET<SpaceWithGates | null>('/api/spaces/search-domain', { search });
  }

  async searchByName(search: string) {
    return http.GET<SpaceWithGates[]>('/api/spaces/search-name', { search });
  }
}
