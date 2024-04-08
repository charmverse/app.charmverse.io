import * as http from 'adapters/http';
import type { ProjectWithMembers } from 'lib/projects/interfaces';
import type { UpdateProjectMemberPayload } from 'lib/projects/updateProjectMember';

export class ProjectsApi {
  removeProjectMember({ projectId, memberId }: { projectId: string; memberId: string }) {
    return http.DELETE(`/api/projects/${projectId}/members/${memberId}`);
  }

  updateProjectMember({
    projectId,
    memberId,
    payload
  }: {
    projectId: string;
    memberId: string;
    payload: UpdateProjectMemberPayload;
  }) {
    return http.PUT<ProjectWithMembers['projectMembers'][number]>(
      `/api/projects/${projectId}/members/${memberId}`,
      payload
    );
  }
}
