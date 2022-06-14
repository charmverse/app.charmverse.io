import { prisma } from 'db';
import { PageContent, User } from 'models';
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

  const mentionedTasksWithoutUserRecord: Record<string, Omit<MentionedTask, 'createdBy'> & {userId: string}> = {};
  const mentionUserIds: string[] = [];

  for (const page of pages) {
    const content = page.content as PageContent;
    if (content) {
      const mentions = extractMentions(content);
      mentions.forEach(mention => {
        if (page.space) {
          mentionUserIds.push(mention.createdBy);
          mentionedTasksWithoutUserRecord[mention.id] = {
            mentionId: mention.id,
            createdAt: mention.createdAt,
            pageId: page.id,
            spaceId: page.space.id,
            spaceDomain: page.space.domain,
            pagePath: page.path,
            spaceName: page.space.name,
            userId: mention.createdBy
          };
        }
      });
    }
  }

  const users = await prisma.user.findMany({
    where: {
      id: {
        in: mentionUserIds
      }
    }
  });

  const usersRecord: Record<string, User> = users.reduce((acc, cur) => ({ ...acc, [cur.id]: cur }), {});

  return Object.values(
    mentionedTasksWithoutUserRecord
  ).map(mentionedTaskWithoutUser => ({ ...mentionedTaskWithoutUser, createdBy: usersRecord[mentionedTaskWithoutUser.userId] }));
}
