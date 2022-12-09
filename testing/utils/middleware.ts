import { v4 } from 'uuid';

import { prisma } from 'db';

export function generateSuperApiToken({ name, token }: { name?: string; token?: string }) {
  return prisma.superApiToken.create({
    data: {
      name: name || '',
      token: token || v4()
    }
  });
}
