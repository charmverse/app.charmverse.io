import type { OptimismProjectFormValues } from 'components/common/form/fields/Optimism/optimismProjectFormValues';
import type { OptimismProjectAttestationContent } from 'pages/api/optimism/projects';

import { useGET, usePOST } from './helpers';

export function useGetOpProjects(enabled: boolean = true) {
  return useGET<OptimismProjectAttestationContent[]>(enabled ? '/api/optimism/projects' : undefined);
}

export function useGetOpProject(attestationId?: string) {
  return useGET<OptimismProjectAttestationContent | null>(
    attestationId ? `/api/optimism/projects/${attestationId}` : undefined
  );
}

export function useCreateOptimismProject() {
  return usePOST<
    OptimismProjectFormValues,
    {
      title: string;
      projectRefUID: string;
    }
  >('/api/optimism/projects');
}
