import type { Project, ProjectMember } from '@charmverse/core/prisma-client';

import { useGETImmutable, usePOST, usePUT } from 'charmClient/hooks/helpers';
import type { AddProjectMemberPayload } from '@packages/lib/projects/addProjectMember';
import type { ProjectAndMembersPayload, ProjectWithMembers } from '@packages/lib/projects/interfaces';
import type { UpdateProjectPayload } from '@packages/lib/projects/updateProject';

export function useCreateProject() {
  return usePOST<ProjectAndMembersPayload, ProjectWithMembers>('/api/projects');
}

export function useGetProjects() {
  return useGETImmutable<ProjectWithMembers[]>('/api/projects');
}

export function useUpdateProject(projectId: string) {
  return usePUT<ProjectAndMembersPayload, ProjectWithMembers>(`/api/projects/${projectId}`);
}

export function usePatchProject(projectId?: string) {
  return usePUT<UpdateProjectPayload, Project>(`/api/projects/${projectId}/patch`);
}

export function useAddProjectMember(projectId?: string) {
  return usePOST<AddProjectMemberPayload, ProjectMember>(`/api/projects/${projectId}/members`);
}
