import { useDELETE, useGET, usePOST, usePUT } from 'charmClient/hooks/helpers';
import type { ProjectAndMembersPayload, ProjectWithMembers } from 'lib/projects/interfaces';

export function useCreateProject() {
  return usePOST<ProjectAndMembersPayload, ProjectWithMembers>('/api/projects');
}

export function useGetProjects() {
  return useGET<ProjectWithMembers[]>('/api/projects');
}

export function useUpdateProject(projectId: string) {
  return usePUT<ProjectAndMembersPayload, ProjectWithMembers>(`/api/projects/${projectId}`);
}
