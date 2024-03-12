import type { Prisma } from '@prisma/client';

export function threadIncludeClause(): Prisma.ThreadInclude {
  return {
    fieldAnswer: {
      select: {
        fieldId: true,
        id: true,
        proposalId: true
      }
    },
    comments: {
      orderBy: {
        createdAt: 'asc'
      }
    }
  };
}
