import type { Project } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { StatusAPIResponse } from '@farcaster/auth-kit';

type FarcasterUser = {
  fid: number;
  pfpUrl: string;
  bio: string;
  username: string;
  displayName: string;
};

export type ConnectProjectDetails = Pick<
  Project,
  | 'id'
  | 'createdBy'
  | 'description'
  | 'avatar'
  | 'coverImage'
  | 'path'
  | 'category'
  | 'name'
  | 'farcasterFrameImage'
  | 'farcasterValues'
  | 'github'
  | 'mirror'
  | 'twitter'
  | 'websites'
> & {
  projectMembers: {
    userId: string | null;
    teamLead: boolean;
    farcasterUser: FarcasterUser;
  }[];
};

export async function fetchProject({
  id,
  path
}: {
  id?: string;
  path?: string;
}): Promise<ConnectProjectDetails | null> {
  if (!id && !path) {
    return null;
  }

  const project = await prisma.project.findFirst({
    where: id ? { id } : { path },
    select: {
      id: true,
      createdBy: true,
      description: true,
      avatar: true,
      coverImage: true,
      name: true,
      category: true,
      farcasterValues: true,
      github: true,
      path: true,
      mirror: true,
      twitter: true,
      websites: true,
      farcasterFrameImage: true,
      projectMembers: {
        orderBy: [
          {
            // team lead first
            teamLead: 'desc'
          },
          {
            createdAt: 'asc'
          }
        ],
        select: {
          teamLead: true,
          userId: true,
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
        userId: member.userId,
        teamLead: member.teamLead,
        farcasterUser: {
          fid: member.user?.farcasterUser?.fid,
          pfpUrl: farcasterUser?.pfpUrl,
          bio: farcasterUser?.bio,
          username: farcasterUser?.username,
          displayName: farcasterUser?.displayName
        } as FarcasterUser
      };
    })
  };
}
