import { useGET, usePOST, usePUT } from 'charmClient/hooks/helpers';
import type { ProjectUpdatePayload, ProjectValues } from 'components/projects/interfaces';
import type { ProjectWithMembers } from 'lib/projects/getProjects';

export function useCreateProject() {
  return usePOST<ProjectValues, ProjectWithMembers>('/api/projects');
}

export function useGetProjects() {
  return useGET<ProjectWithMembers[]>('/api/projects');
}

export function useUpdateProject({ projectId }: { projectId: string }) {
  return usePUT<ProjectUpdatePayload, ProjectWithMembers>(`/api/projects/${projectId}`);
}
