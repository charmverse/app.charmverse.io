import type { OptimismProjectAttestationContent } from '@packages/lib/optimism/getOpProjectsByFarcasterId';
import type { FormValues as OptimismProjectFormValues } from '@packages/lib/optimism/projectSchema';

import { useGET, usePOST, usePUT } from './helpers';

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

export function useEditOptimismProject(attestationId: string) {
  return usePUT<OptimismProjectFormValues>(`/api/optimism/projects/${attestationId}`);
}
