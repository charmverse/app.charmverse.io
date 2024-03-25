import { useGET, usePOST } from 'charmClient/hooks/helpers';
import type { ProjectValues, ProjectWithMembers } from 'components/projects/interfaces';

export function useCreateProject() {
  return usePOST<ProjectValues, ProjectWithMembers>('/api/projects');
}

export function useGetProjects() {
  return useGET<ProjectWithMembers[]>('/api/projects');
}

export function useAddProjectMember({ projectId }: { projectId: string }) {
  return usePOST<undefined, ProjectWithMembers['projectMembers'][number]>(`/api/projects/${projectId}/members`);
}
