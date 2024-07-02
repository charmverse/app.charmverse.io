import type { OptimismProjectAttestationContent } from 'pages/api/optimism/projects';

import { useGET } from './helpers';

export function useGetOpProjects(enabled: boolean = true) {
  return useGET<OptimismProjectAttestationContent[]>(enabled ? '/api/optimism/projects' : undefined);
}

export function useGetOpProject(attestationId?: string) {
  return useGET<OptimismProjectAttestationContent | null>(
    attestationId ? `/api/optimism/projects/${attestationId}` : undefined
  );
}
