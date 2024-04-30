import { prisma } from '@charmverse/core/prisma-client';

import { generateMarkdown } from 'lib/prosemirror/markdown/generateMarkdown';

// get data related to pages
export async function getPageMarkdown({
  pageId,
  includePrivateFields
}: {
  pageId: string;
  includePrivateFields?: boolean;
}) {
  const page = await prisma.page.findFirstOrThrow({
    where: { id: pageId },
    select: {
      content: true,
      spaceId: true,
      proposal: {
        include: {
          form: {
            include: {
              formFields: true
            }
          },
          formAnswers: true
        }
      }
    }
  });
  const spaceRoles = await prisma.spaceRole.findMany({
    where: {
      spaceId: page.spaceId
    },
    include: {
      user: true
    }
  });
  const spaceMembers = spaceRoles.map((role) => role.user);

  return generateMarkdown({
    content: page.content,
    generatorOptions: {
      members: spaceMembers
    }
  });
}
