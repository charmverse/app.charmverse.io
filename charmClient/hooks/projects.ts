import { useGET, usePOST, usePUT } from 'charmClient/hooks/helpers';
import type { ProjectUpdatePayload, ProjectValues, ProjectWithMembers } from 'lib/projects/interfaces';

export function useCreateProject() {
  return usePOST<ProjectValues, ProjectWithMembers>('/api/projects');
}

export function useGetProjects() {
  return useGET<ProjectWithMembers[]>('/api/projects');
}

export function useUpdateProject(projectId: string) {
  return usePUT<ProjectUpdatePayload, ProjectWithMembers>(`/api/projects/${projectId}`);
}

export function useAddProjectMember({ projectId }: { projectId: string }) {
  return usePOST<undefined, ProjectWithMembers['projectMembers'][number]>(`/api/projects/${projectId}/members`);
}
