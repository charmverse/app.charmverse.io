import type { OPProjectData } from 'lib/optimism/getOpProjects';

import { useGET } from './helpers';

export function useGetOpProjects(enabled: boolean = true) {
  return useGET<OPProjectData[]>(enabled ? '/api/optimism/projects' : undefined);
}

export function useGetOpProject(attestationId?: string) {
  return useGET<OPProjectData | null>(attestationId ? `/api/optimism/projects/${attestationId}` : undefined);
}
