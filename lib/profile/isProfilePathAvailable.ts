import { prisma } from 'db';

export async function isProfilePathAvailable (path: string, id?: string | null): Promise<boolean> {
  const existing = await prisma.user.findUnique({
    where: {
      path
    },
    select: { id: true }
  });

  if (existing) {
    return id ? existing.id === id : false;
  }

  return true;
}
