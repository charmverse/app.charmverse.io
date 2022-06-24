import { prisma } from 'db';

export async function getCompletedApplicationsOfUser (userId: string) {
  return prisma.application.count({
    where: {
      status: 'complete',
      applicant: {
        id: userId
      }
    }
  });
}
