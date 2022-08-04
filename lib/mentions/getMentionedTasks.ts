import { Space } from '@prisma/client';
import { prisma } from 'db';
import { extractMentions } from 'lib/prosemirror/extractMentions';
import { shortenHex } from 'lib/utilities/strings';
import { PageContent, User } from 'models';
import { uniq } from 'lodash';
import { MentionedTask } from './interfaces';

export type MentionedTasksGroup = {
  marked: MentionedTask[],
  unmarked: MentionedTask[]
}

type Mention = Omit<MentionedTask, 'createdBy'> & { userId: string };

interface GetMentionsInput {
  userId: string;
  username: string;
  spaceIds: string[];
  spaceRecord: Record<string, Pick<Space, 'name' | 'domain' | 'id'>>;
}

interface GetMentionsResponse {
  mentions: Record<string, Mention>;
  mentionedUserIds: string[];
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

  // Get the username of the user, its required when constructing the mention message text
  const user = await prisma.user.findUnique({
    where: {
      id: userId
    },
    select: {
      username: true
    }
  });

  const username = user?.username ?? shortenHex(userId);

  // Array of space ids the user is part of
  const spaceIds = spaceRoles.map(spaceRole => spaceRole.spaceId);

  const notifications = await prisma.userNotification.findMany({
    where: {
      userId,
      type: 'mention'
    },
    select: {
      taskId: true
    }
  });

  const spaces = await prisma.space.findMany({
    where: {
      id: {
        in: spaceIds
      }
    },
    select: {
      domain: true,
      id: true,
      name: true
    }
  });

  const spaceRecord: Record<string, Pick<Space, 'name' | 'domain' | 'id'>> = {};

  spaces.forEach(space => {
    spaceRecord[space.id] = space;
  });

  // Get the marked mention task ids (all the discussion type tasks that exist in the db)
  const notifiedTaskIds = new Set(notifications.map(notification => notification.taskId));

  const context: GetMentionsInput = { userId, username, spaceRecord, spaceIds };

  const { mentions, mentionedUserIds } = await Promise.all([
    getMentionsFromComments(context),
    getMentionsFromPages(context),
    getMentionsFromCommentBlocks(context)
  ]).then(results => {
    // aggregate the results
    return results.reduce((acc, result) => {
      Object.assign(acc.mentions, result.mentions);
      acc.mentionedUserIds = acc.mentionedUserIds.concat(result.mentionedUserIds);
      return acc;
    }, { mentions: {}, mentionedUserIds: [] });
  });

  // Only fetch the users that created the mentions
  const users = await prisma.user.findMany({
    where: {
      id: {
        in: uniq(mentionedUserIds)
      }
    }
  });

  // Create a record for the user
  const usersRecord = users.reduce<Record<string, User>>((acc, cur) => ({ ...acc, [cur.id]: cur }), {});

  // Loop through each mentioned task and attach the user data using usersRecord
  const mentionedTasks = Object.values(mentions).reduce<MentionedTasksGroup>((acc, mentionedTaskWithoutUser) => {

    const mentionedTask = {
      ...mentionedTaskWithoutUser,
      createdBy: usersRecord[mentionedTaskWithoutUser.userId]
    } as MentionedTask;

    const taskList = notifiedTaskIds.has(mentionedTask.mentionId) ? acc.marked : acc.unmarked;
    taskList.push(mentionedTask);

    return acc;
  }, { marked: [], unmarked: [] });

  return {
    marked: mentionedTasks.marked.sort(sortByDate),
    unmarked: mentionedTasks.unmarked.sort(sortByDate)
  };
}

function sortByDate <T extends { createdAt: string }> (a: T, b: T): number {
  return a.createdAt > b.createdAt ? -1 : 1;
}

async function getMentionsFromCommentBlocks ({ userId, username, spaceRecord, spaceIds }: GetMentionsInput): Promise<GetMentionsResponse> {

  const blockComments = await prisma.block.findMany({
    where: {
      type: 'comment',
      spaceId: {
        in: spaceIds
      },
      deletedAt: null
    },
    select: {
      id: true,
      createdBy: true,
      spaceId: true,
      fields: true,
      rootId: true
    }
  });

  const pages = await prisma.page.findMany({
    where: {
      id: {
        in: blockComments.map(block => block.rootId)
      }
    }
  });

  const mentionsMap: GetMentionsResponse['mentions'] = {};
  const mentionedUserIds: string[] = [];

  for (const comment of blockComments) {
    const content = (comment.fields as any)?.content as PageContent;
    if (content) {
      const mentions = extractMentions(content, username);
      mentions.forEach(mention => {
        const page = pages.find(p => p.id === comment.rootId);
        if (page && mention.value === userId && mention.createdBy !== userId && comment.createdBy !== userId) {
          mentionedUserIds.push(mention.createdBy);
          mentionsMap[mention.id] = {
            mentionId: mention.id,
            createdAt: mention.createdAt,
            pageId: page.id,
            spaceId: comment.spaceId,
            spaceDomain: spaceRecord[comment.spaceId].domain,
            pagePath: page.path,
            spaceName: spaceRecord[comment.spaceId].name,
            userId: mention.createdBy,
            pageTitle: page.title,
            text: mention.text,
            bountyId: null,
            bountyTitle: null,
            commentId: comment.id,
            type: 'page'
          };
        }
      });
    }
  }
  return {
    mentions: mentionsMap,
    mentionedUserIds
  };
}

async function getMentionsFromComments ({ userId, username, spaceRecord, spaceIds }: GetMentionsInput): Promise<GetMentionsResponse> {

  const comments = await prisma.comment.findMany({
    where: {
      spaceId: {
        in: spaceIds
      },
      page: {
        deletedAt: null
      }
    },
    select: {
      id: true,
      userId: true,
      spaceId: true,
      content: true,
      page: {
        select: {
          title: true,
          id: true,
          path: true
        }
      }
    }
  });

  const mentionsMap: GetMentionsResponse['mentions'] = {};
  const mentionedUserIds: string[] = [];

  for (const comment of comments) {
    const content = comment.content as PageContent;
    if (content) {
      const mentions = extractMentions(content, username);
      mentions.forEach(mention => {
        if (mention.value === userId && mention.createdBy !== userId && comment.userId !== userId) {
          mentionedUserIds.push(mention.createdBy);
          mentionsMap[mention.id] = {
            mentionId: mention.id,
            createdAt: mention.createdAt,
            pageId: comment.page.id,
            spaceId: comment.spaceId,
            spaceDomain: spaceRecord[comment.spaceId].domain,
            pagePath: comment.page.path,
            spaceName: spaceRecord[comment.spaceId].name,
            userId: mention.createdBy,
            pageTitle: comment.page.title,
            text: mention.text,
            bountyId: null,
            bountyTitle: null,
            commentId: comment.id,
            type: 'page'
          };
        }
      });
    }
  }
  return {
    mentions: mentionsMap,
    mentionedUserIds
  };
}

async function getMentionsFromPages ({ userId, username, spaceRecord, spaceIds }: GetMentionsInput): Promise<GetMentionsResponse> {

  // Get all the pages of all the spaces this user is part of
  const pages = await prisma.page.findMany({
    where: {
      spaceId: {
        in: spaceIds
      },
      deletedAt: null
    },
    select: {
      bountyId: true,
      content: true,
      id: true,
      path: true,
      title: true,
      createdBy: true,
      spaceId: true
    }
  });

  const mentionsMap: GetMentionsResponse['mentions'] = {};
  const mentionedUserIds: string[] = [];

  for (const page of pages) {
    const content = page.content as PageContent;
    if (content) {
      const mentions = extractMentions(content, username);
      mentions.forEach(mention => {
        // Skip mentions not for the user, self mentions and inside user created pages
        if (mention.value === userId && mention.createdBy !== userId) {
          mentionedUserIds.push(mention.createdBy);
          mentionsMap[mention.id] = {
            mentionId: mention.id,
            bountyId: page.bountyId,
            createdAt: mention.createdAt,
            pageId: page.id,
            spaceId: page.spaceId,
            spaceDomain: spaceRecord[page.spaceId].domain,
            pagePath: page.path,
            spaceName: spaceRecord[page.spaceId].name,
            userId: mention.createdBy,
            pageTitle: page.title,
            text: mention.text,
            bountyTitle: page.title,
            commentId: null,
            type: page.bountyId ? 'bounty' : 'page'
          };
        }
      });
    }
  }

  return {
    mentions: mentionsMap,
    mentionedUserIds
  };
}
