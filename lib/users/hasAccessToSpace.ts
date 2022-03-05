import { prisma } from 'db';
import { Role } from 'models';

interface Input {
  userId: string;
  spaceId: string;
  role?: Role;
}

interface Result {
  error?: string;
  success?: boolean;
}

export async function hasAccessToSpace ({ userId, spaceId, role = 'contributor' }: Input): Promise<Result> {

  if (!spaceId || !userId) {
    return { error: 'userId and spaceId are required' };
  }

  const spaceRole = await prisma.spaceRole.findFirst({
    where: {
      spaceId,
      userId
    }
  });
  if (!spaceRole) {
    return { error: 'User does not have access to space' };
  }
  else if (role === 'admin' && spaceRole.role !== role) {
    return { error: 'Requires admin permission' };
  }
  return { success: true };
}
