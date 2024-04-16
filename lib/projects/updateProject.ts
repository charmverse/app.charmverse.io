import { prisma } from '@charmverse/core/prisma-client';

import type { ProjectPayload } from './interfaces';

export type UpdateProjectPayload = Partial<ProjectPayload> & {
  id: string;
};

export async function updateProject({
  projectValues: { id: projectId, ...projectValuesWithoutId }
}: {
  projectValues: UpdateProjectPayload;
}) {
  return prisma.project.update({
    where: {
      id: projectId
    },
    data: {
      ...projectValuesWithoutId
    }
  });
}
