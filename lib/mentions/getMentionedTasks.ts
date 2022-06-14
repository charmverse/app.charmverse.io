import { prisma } from 'db';
import { PageContent, User } from 'models';
import { extractMentions } from './extractMentions';
import { MentionedTask } from './interfaces';

export type MentionedTasksGroup = {
  marked: MentionedTask[],
  unmarked: MentionedTask[]
}

export async function getMentionedTasks (userId: string): Promise<MentionedTasksGroup> {
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

  const markedMentionTasks = await prisma.userNotification.findMany({
    where: {
      userId,
      type: 'mention'
    },
    select: {
      taskId: true
    }
  });

  const markedMentionTaskIds = new Set(markedMentionTasks.map(markedMentionTask => markedMentionTask.taskId));

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
      title: true,
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
            userId: mention.createdBy,
            pageTitle: page.title,
            text: mention.text
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

  const mentionedTasks: MentionedTasksGroup = { marked: [], unmarked: [] };

  Object.values(
    mentionedTasksWithoutUserRecord
  ).forEach(mentionedTaskWithoutUser => {
    // joining the mentioned task with the user
    const mentionedTask = { ...mentionedTaskWithoutUser, createdBy: usersRecord[mentionedTaskWithoutUser.userId] };
    if (markedMentionTaskIds.has(mentionedTask.mentionId)) {
      mentionedTasks.marked.push(mentionedTask);
    }
    else {
      mentionedTasks.unmarked.push(mentionedTask);
    }
  });

  return {
    marked: mentionedTasks.marked.sort((mentionTaskA, mentionTaskB) => mentionTaskA.createdAt > mentionTaskB.createdAt ? -1 : 1),
    unmarked: mentionedTasks.unmarked.sort((mentionTaskA, mentionTaskB) => mentionTaskA.createdAt > mentionTaskB.createdAt ? -1 : 1)
  };
}
