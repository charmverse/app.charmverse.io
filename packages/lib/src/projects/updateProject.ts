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
      ...projectValuesWithoutId,
      // our multitextinput form field sometimes sends [undefined] at first if no website is given
      websites: projectValuesWithoutId.websites?.map((url) => url?.trim()).filter(Boolean)
    }
  });
}
