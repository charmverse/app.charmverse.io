import type { Project } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

export type ConnectProjectMinimal = Pick<Project, 'id' | 'name'>;

export async function getConnectProjectsByFid(fid: number): Promise<ConnectProjectMinimal[]> {
  const projects = await prisma.project.findMany({
    where: {
      projectMembers: {
        some: {
          user: {
            farcasterUser: {
              fid
            }
          }
        }
      },
      source: {
        in: ['connect', 'farcaster']
      }
    },
    select: {
      id: true,
      name: true
    }
  });

  return projects;
}
