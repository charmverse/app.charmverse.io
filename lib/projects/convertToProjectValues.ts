import type { ProjectAndMembersPayload, ProjectWithMembers } from './interfaces';

export function convertToProjectValues(projectWithMembers: ProjectWithMembers): ProjectAndMembersPayload {
  return {
    blog: projectWithMembers.blog,
    communityUrl: projectWithMembers.communityUrl,
    description: projectWithMembers.description,
    excerpt: projectWithMembers.excerpt,
    github: projectWithMembers.github,
    name: projectWithMembers.name,
    otherUrl: projectWithMembers.otherUrl,
    demoUrl: projectWithMembers.demoUrl,
    twitter: projectWithMembers.twitter,
    walletAddress: projectWithMembers.walletAddress,
    website: projectWithMembers.website,
    deletedAt: projectWithMembers.deletedAt,
    projectMembers: projectWithMembers.projectMembers.map((projectMember) => {
      return {
        warpcast: projectMember.warpcast,
        email: projectMember.email,
        github: projectMember.github,
        linkedin: projectMember.linkedin,
        name: projectMember.name,
        otherUrl: projectMember.otherUrl,
        previousProjects: projectMember.previousProjects,
        telegram: projectMember.telegram,
        twitter: projectMember.twitter,
        walletAddress: projectMember.walletAddress,
        id: projectMember.id,
        userId: projectMember.userId
      };
    })
  };
}
