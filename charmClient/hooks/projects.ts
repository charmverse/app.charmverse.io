import type { Project, ProjectMember } from '@charmverse/core/prisma-client';

import { useDELETE, useGET, usePOST, usePUT } from 'charmClient/hooks/helpers';
import type { AddProjectMemberPayload } from 'lib/projects/addProjectMember';
import type { ProjectAndMembersPayload, ProjectWithMembers } from 'lib/projects/interfaces';
import type { UpdateProjectPayload } from 'lib/projects/updateProject';

export function useCreateProject() {
  return usePOST<ProjectAndMembersPayload, ProjectWithMembers>('/api/projects');
}

export function useGetProjects() {
  return useGET<ProjectWithMembers[]>('/api/projects');
}

export function useUpdateProject(projectId: string) {
  return usePUT<ProjectAndMembersPayload, ProjectWithMembers>(`/api/projects/${projectId}`);
}

export function usePatchProject(projectId: string) {
  return usePUT<UpdateProjectPayload, Project>(`/api/projects/${projectId}/patch`);
}

export function useAddProjectMember(projectId: string) {
  return usePOST<AddProjectMemberPayload, ProjectMember>(`/api/projects/${projectId}/members`);
}
