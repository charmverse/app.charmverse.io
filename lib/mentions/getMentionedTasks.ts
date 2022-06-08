import { prisma } from 'db';
import { PageContent } from 'models';
import { extractMentions } from './extractMentions';
import { MentionedTasks } from './interfaces';

export async function getMentionedTasks (userId: string): Promise<MentionedTasks[]> {
  // Get all the space the user is part of
  const spaceRoles = await prisma.spaceRole.findMany({
    where: {
      userId
    },
    select: {
      spaceId: true
    }
  });

  const spaceIds = spaceRoles.map(spaceRole => spaceRole.spaceId);

  const pages = await prisma.page.findMany({
    where: {
      spaceId: {
        in: spaceIds
      }
    },
    select: {
      content: true,
      id: true
    }
  });

  const mentionedTasks: MentionedTasks[] = [];

  for (const page of pages) {
    const content = page.content as PageContent;
    if (content) {
      const mentionIds = extractMentions(content);
      mentionIds.forEach(mentionId => {
        mentionedTasks.push({
          mentionId,
          pageId: page.id
        });
      });
    }
  }

  return mentionedTasks;
}
