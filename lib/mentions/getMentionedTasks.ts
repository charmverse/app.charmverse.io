import { prisma } from 'db';
import { PageContent } from 'models';
import { extractMentions } from './extractMentions';
import { MentionedTask } from './interfaces';

export async function getMentionedTasks (userId: string): Promise<MentionedTask[]> {
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
      id: true,
      path: true,
      space: {
        select: {
          domain: true,
          id: true,
          name: true
        }
      }
    }
  });

  const mentionedTasks: MentionedTask[] = [];

  for (const page of pages) {
    const content = page.content as PageContent;
    if (content) {
      const mentions = extractMentions(content);
      mentions.forEach(mention => {
        if (page.space) {
          mentionedTasks.push({
            mentionId: mention.id,
            createdAt: mention.createdAt,
            pageId: page.id,
            spaceId: page.space.id,
            spaceDomain: page.space.domain,
            pagePath: page.path,
            spaceName: page.space.name
          });
        }
      });
    }
  }

  return mentionedTasks;
}
