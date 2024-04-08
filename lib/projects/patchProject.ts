import { prisma } from '@charmverse/core/prisma-client';

import type { ProjectPayload } from './interfaces';

export type UpdateProjectPayload = Partial<ProjectPayload> & {
  id: string;
};

export async function patchProject({ projectValues }: { projectValues: UpdateProjectPayload }) {
  return prisma.project.update({
    where: {
      id: projectValues.id
    },
    data: {
      blog: projectValues.blog,
      communityUrl: projectValues.communityUrl,
      demoUrl: projectValues.demoUrl,
      description: projectValues.description,
      excerpt: projectValues.excerpt,
      website: projectValues.website,
      github: projectValues.github,
      name: projectValues.name,
      otherUrl: projectValues.otherUrl,
      twitter: projectValues.twitter,
      walletAddress: projectValues.walletAddress
    }
  });
}
