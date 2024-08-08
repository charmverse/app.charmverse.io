import type { ProjectAndMembersPayload, ProjectWithMembers } from './interfaces';

export function convertToProjectValues(projectWithMembers: ProjectWithMembers): ProjectAndMembersPayload {
  return {
    description: projectWithMembers.description,
    name: projectWithMembers.name,
    twitter: projectWithMembers.twitter,
    github: projectWithMembers.github,
    walletAddress: projectWithMembers.walletAddress,
    websites: projectWithMembers.websites,
    deletedAt: projectWithMembers.deletedAt,
    projectMembers: projectWithMembers.projectMembers.map((projectMember) => {
      return {
        email: projectMember.email,
        name: projectMember.name,
        socialUrls: projectMember.socialUrls,
        walletAddress: projectMember.walletAddress,
        id: projectMember.id,
        // note that teamLead is not set by the user but it is required for validating the form
        teamLead: projectMember.teamLead,
        userId: projectMember.userId
      };
    })
  };
}
