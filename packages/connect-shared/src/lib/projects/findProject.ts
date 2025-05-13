import type { Project } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { StatusAPIResponse } from '@farcaster/auth-kit';
import { replaceS3Domain } from '@packages/utils/url';

import type { FarcasterProfileInfo } from '../session/loginWithFarcaster';

export type ConnectProjectMember = {
  farcasterId: number;
  name: string;
  teamLead: boolean;
  farcasterUser: FarcasterProfileInfo;
  userId: string | null;
};

export type ConnectProjectDetails = Pick<
  Project,
  | 'id'
  | 'createdBy'
  | 'description'
  | 'avatar'
  | 'coverImage'
  | 'path'
  | 'optimismCategory'
  | 'sunnyAwardsCategory'
  | 'sunnyAwardsCategoryDetails'
  | 'name'
  | 'farcasterFrameImage'
  | 'farcasterValues'
  | 'github'
  | 'twitter'
  | 'websites'
  | 'sunnyAwardsProjectType'
  | 'mintingWalletAddress'
  | 'primaryContractAddress'
  | 'primaryContractChainId'
  | 'sunnyAwardsNumber'
> & {
  projectMembers: ConnectProjectMember[];
};

export async function findProject({ id, path }: { id?: string; path?: string }): Promise<ConnectProjectDetails | null> {
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
      optimismCategory: true,
      sunnyAwardsCategory: true,
      sunnyAwardsCategoryDetails: true,
      farcasterValues: true,
      github: true,
      path: true,
      twitter: true,
      websites: true,
      farcasterFrameImage: true,
      sunnyAwardsProjectType: true,
      mintingWalletAddress: true,
      primaryContractAddress: true,
      primaryContractChainId: true,
      sunnyAwardsNumber: true,
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
    avatar: replaceS3Domain(project.avatar),
    coverImage: replaceS3Domain(project.coverImage),
    projectMembers: project.projectMembers.map((member) => {
      const farcasterUser = member.user?.farcasterUser?.account as unknown as StatusAPIResponse;
      return {
        ...member.user,
        userId: member.userId,
        teamLead: member.teamLead,
        name: farcasterUser?.displayName || farcasterUser?.username || '',
        farcasterId: member.user?.farcasterUser?.fid as number,
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
