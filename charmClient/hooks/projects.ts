import { useGET, usePOST } from 'charmClient/hooks/helpers';
import type { ProjectValues } from 'components/projects/interfaces';
import type { ProjectWithMembers } from 'lib/projects/getProjects';

export function useCreateProject() {
  return usePOST<ProjectValues, ProjectWithMembers>('/api/projects');
}

export function useGetProjects() {
  return useGET<ProjectWithMembers[]>('/api/projects');
}
