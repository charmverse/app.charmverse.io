import { prisma } from '@charmverse/core/prisma-client';
import type { StatusAPIResponse } from '@farcaster/auth-kit';

export type ProjectData = Awaited<ReturnType<typeof fetchProject>>;

export async function fetchProject(projectId: string) {
  const project = await prisma.project.findUnique({
    where: {
      id: projectId
    },
    select: {
      id: true,
      description: true,
      avatar: true,
      coverImage: true,
      name: true,
      farcasterValues: true,
      github: true,
      mirror: true,
      twitter: true,
      websites: true,
      farcasterFrameImage: true,
      projectMembers: {
        select: {
          user: {
            select: {
              farcasterUser: true
            }
          }
        }
      }
    }
  });

  if (!project) {
    return null;
  }

  return {
    ...project,
    projectMembers: project.projectMembers.map((member) => {
      const farcasterUser = member.user?.farcasterUser?.account as unknown as StatusAPIResponse;
      return {
        ...member.user,
        farcasterUser: {
          fid: member.user?.farcasterUser?.fid,
          pfpUrl: farcasterUser?.pfpUrl,
          bio: farcasterUser?.bio,
          username: farcasterUser?.username,
          displayName: farcasterUser?.displayName
        }
      };
    })
  };
}
