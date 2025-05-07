import { prisma } from '@charmverse/core/prisma-client';

export async function convertMemberPropertyNameToText() {
  await prisma.memberProperty.updateMany({
    where: {
      // @ts-ignore
      type: 'name'
    },
    data: {
      type: 'text'
    }
  });
}

convertMemberPropertyNameToText();
