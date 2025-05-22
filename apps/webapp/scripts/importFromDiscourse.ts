import { log } from '@charmverse/core/log';
import {
  User as CharmverseUser,
  Post as CharmversePost,
  PostTag,
  PostCategory,
  PostComment,
  prisma
} from '@charmverse/core/prisma-client';
import { GET } from '@charmverse/core/http';
import { htmlToText } from 'html-to-text';
import { RateLimit } from 'async-sema';
import { parseMarkdown } from '@packages/bangleeditor/markdown/parseMarkdown';
import TurndownService from 'turndown';
import emoji from 'emoji-js';
import { PremiumPermissionsClient } from '@charmverse/core/permissions';
import { getPermissionsClient } from 'lib/permissions/api';

const rateLimiter = RateLimit(1);

const emojiConverter = new emoji.EmojiConvertor();
emojiConverter.replace_mode = 'unified';

const turndownService = new TurndownService();

type User = {
  id: number;
  username: string;
  name?: string;
  avatar_template: string;
  flair_name: null | string;
  admin?: boolean;
  moderator?: boolean;
  trust_level: number;
};

type Poster = {
  extras: string;
  description: string;
  user_id: number;
  primary_group_id?: number | null;
  flair_group_id?: number | null;
};

type Topic = {
  id: number;
  title: string;
  fancy_title: string;
  slug: string;
  posts_count: number;
  reply_count: number;
  highest_post_number: number;
  image_url: string | null;
  created_at: string;
  last_posted_at: string;
  bumped: boolean;
  bumped_at: string;
  archetype: string;
  unseen: boolean;
  pinned: boolean;
  unpinned: boolean | null;
  excerpt: string;
  visible: boolean;
  closed: boolean;
  archived: boolean;
  bookmarked: boolean | null;
  liked: boolean | null;
  tags: string[];
  tags_descriptions: Record<string, string>;
  views: number;
  like_count: number;
  has_summary: boolean;
  last_poster_username: string;
  category_id: number;
  pinned_globally: boolean;
  featured_link: string | null;
  posters: Poster[];
};

type Category = {
  id: number;
  name: string;
  color: string;
  text_color: string;
  slug: string;
  topic_count: number;
  post_count: number;
  position: number;
  description: string;
  description_text: string;
  description_excerpt: string;
  topic_url: string | null;
  read_restricted: boolean;
  permission: string | null;
  notification_level: number;
  topic_template: string | null;
  has_children: boolean;
  sort_order: string | null;
  sort_ascending: boolean | null;
  show_subcategory_list: boolean;
  num_featured_topics: number;
  default_view: string | null;
  subcategory_list_style: string;
  default_top_period: string;
  default_list_filter: string;
  minimum_required_tags: number;
  navigate_to_first_post_after_read: boolean;
  topics_day: number;
  topics_week: number;
  topics_month: number;
  topics_year: number;
  topics_all_time: number;
  is_uncategorized: boolean;
  subcategory_ids: number[];
  uploaded_logo: string | null;
  uploaded_background: string | null;
};

type Tag = {
  id: string;
  text: string;
  name: string;
  description: string | null;
  count: number;
  pm_count: number;
  target_tag: string | null;
};

type Post = {
  id: number;
  name: string;
  username: string;
  avatar_template: string;
  created_at: string;
  cooked: string;
  post_number: number;
  post_type: number;
  updated_at: string;
  reply_count: number;
  reply_to_post_number: number | null;
  quote_count: number;
  incoming_link_count: number;
  reads: number;
  readers_count: number;
  score: number;
  yours: boolean;
  topic_id: number;
  topic_slug: string;
  topic_title: string;
  topic_html_title: string;
  category_id: number;
  display_username: string;
  primary_group_name: string | null;
  flair_name: string | null;
  flair_url: string | null;
  flair_bg_color: string | null;
  flair_color: string | null;
  version: number;
  can_edit: boolean;
  can_delete: boolean;
  can_recover: boolean;
  can_wiki: boolean;
  user_title: string | null;
  bookmarked: boolean;
  raw: string;
  actions_summary?: { id: number; count: number }[];
  moderator: boolean;
  admin: boolean;
  staff: boolean;
  user_id: number;
  hidden: boolean;
  trust_level: number;
  deleted_at: string | null;
  user_deleted: boolean;
  edit_reason: string | null;
  can_view_edit_history: boolean;
  wiki: boolean;
};

type UserAction = {
  excerpt: string;
  truncated: boolean;
  action_type: number;
  created_at: string;
  avatar_template: string;
  acting_avatar_template: string;
  slug: string;
  topic_id: number;
  target_user_id: number;
  target_name: string;
  target_username: string;
  post_number: number;
  post_id: number;
  username: string;
  name: string;
  user_id: number;
  acting_username: string;
  acting_name: string;
  acting_user_id: number;
  title: string;
  deleted: boolean;
  hidden: boolean;
  post_type: number;
  action_code: null | number;
  category_id: number;
  closed: boolean;
  archived: boolean;
};

const usernameSuffix = 'imported';
const pathSuffix = '-discourse-bot';

async function createCharmverseUser({
  avatar_template,
  community,
  spaceId,
  username
}: {
  avatar_template: string;
  username: string;
  spaceId: string;
  community: string;
}) {
  const charmverseUser = await prisma.user.create({
    data: {
      username: `${username}-${usernameSuffix}`,
      path: `${username.toLowerCase()}-${pathSuffix}`,
      avatar: `https://${community}${avatar_template.replace('{size}', '80')}`,
      isBot: true
    }
  });

  await prisma.spaceRole.create({
    data: {
      userId: charmverseUser.id,
      spaceId
    }
  });

  return charmverseUser;
}

function preprocessMarkup(htmlContent: string) {
  // Replace emoji image tags with their text representation
  const emojiReplacedMarkdown = emojiConverter.replace_colons(
    htmlContent.replaceAll(/<img.*?title=":(.*?):".*?>/g, ':$1:')
  );
  const markdown = turndownService.turndown(emojiReplacedMarkdown);
  // Update the username and the path of the users
  const usernameLinkRegex = /(?:(\[@.*?)\](\(\/u\/.*?)\))/g;
  const usernameReplacedMarkdown = markdown.replaceAll(usernameLinkRegex, `$1-${usernameSuffix}]$2-${pathSuffix})`);
  // Replacing the html tags to get the raw text
  return parseMarkdown(usernameReplacedMarkdown);
}

export async function importFromDiscourse(community: string, spaceDomain: string) {
  try {
    const space = await prisma.space.findFirstOrThrow({
      where: {
        domain: spaceDomain
      }
    });

    const spaceId = space.id;

    const {
      category_list: { categories }
    } = await GET<{
      category_list: {
        categories: Category[];
      };
    }>(`https://${community}/categories.json`, {});

    const { tags } = await GET<{ tags: Tag[] }>(`https://${community}/tags.json`, {});

    const postTagRecord: Record<string, PostTag> = {};

    for (const tag of tags) {
      const postTag = await prisma.postTag.create({
        data: {
          name: tag.name,
          spaceId
        }
      });
      postTagRecord[tag.id] = postTag;
    }
    const postCategoriesRecord: Record<string, PostCategory> = {};

    for (const category of categories) {
      const postCategory = await prisma.postCategory.create({
        data: {
          name: category.name === 'Uncategorized' ? 'General' : category.name,
          spaceId,
          description: category.description_text,
          path: category.slug === 'uncategorized' ? 'general' : category.slug
        }
      });

      const { client, type } = await getPermissionsClient({
        resourceId: postCategory.id,
        resourceIdType: 'postCategory'
      });

      const r = await (client as PremiumPermissionsClient).forum.assignDefaultPostCategoryPermissions({
        resourceId: postCategory.id
      });

      postCategoriesRecord[category.id] = postCategory;
    }

    const topicPostsRecord: Record<
      string,
      {
        topic: Topic;
        posts: Post[];
      }
    > = {};
    // Using a record to avoid duplicates
    const discourseUserRecord: Record<string, User> = {};
    const userRecord: Record<string, CharmverseUser> = {};
    const postRecord: Record<string, CharmversePost> = {};
    const postCommentRecord: Record<string, PostComment> = {};
    const postLikesRecord: Record<string, { likedUserIds: string[]; totalLikes: number }> = {};

    async function fetchAndStoreUser({
      userId,
      username,
      postFetchUserCb
    }: {
      postFetchUserCb?: (fetchedUser: User) => void;
      userId: number;
      username: string;
    }) {
      if (!userRecord[userId]) {
        await rateLimiter();
        const fetchedUser = (await GET<{ user: User }>(`https://${community}/users/${username}.json`, {})).user;
        userRecord[userId] = await createCharmverseUser({
          community,
          spaceId,
          username: fetchedUser.username,
          avatar_template: fetchedUser.avatar_template
        });
        discourseUserRecord[userId] = fetchedUser;
        postFetchUserCb?.(fetchedUser);
      }

      return userRecord[userId];
    }

    for (const categoryId in postCategoriesRecord) {
      await rateLimiter();
      const {
        topic_list: { topics: fetchedTopics }
      } = await GET<{ users: User[]; topic_list: { topics: Topic[] } }>(
        `https://${community}/c/${categoryId}.json`,
        {}
      );
      for (const topic of fetchedTopics) {
        await rateLimiter();
        const {
          post_stream: { posts: fetchedPosts }
        } = await GET<{ post_stream: { posts: Post[] } }>(`https://${community}/t/${topic.id}.json`, {});
        topicPostsRecord[topic.id] = {
          posts: fetchedPosts,
          topic
        };
      }
    }

    let topicCounter = 0;
    const totalTopics = Object.keys(topicPostsRecord).length;

    for (const { posts, topic } of Object.values(topicPostsRecord)) {
      const sortedPosts = posts.sort((post1, post2) => post1.post_number - post2.post_number);
      const rootPost = sortedPosts.find((post) => post.post_number === 1);
      if (!rootPost) {
        continue;
      }

      const topicContent = preprocessMarkup(rootPost.cooked);

      await rateLimiter();
      const topicAuthor = await fetchAndStoreUser({
        userId: rootPost.user_id,
        username: rootPost.username
      });

      postLikesRecord[rootPost.id] = {
        likedUserIds: [],
        totalLikes: rootPost.actions_summary?.find((action) => action.id === 2)?.count || 0
      };

      if (!topicAuthor) {
        continue;
      }

      const post = await prisma.post.create({
        data: {
          title: topic.title,
          path: topic.slug,
          categoryId: postCategoriesRecord[topic.category_id].id,
          spaceId,
          contentText: htmlToText(rootPost.cooked),
          content: topicContent,
          createdBy: topicAuthor.id,
          postToPostTags: {
            createMany: {
              data: topic.tags.map((tagId) => ({ postTagId: postTagRecord[tagId].id }))
            }
          }
        }
      });

      postRecord[rootPost.id] = post;

      for (const topicPost of posts) {
        if (topicPost.post_number === 1) {
          continue;
        }

        postLikesRecord[topicPost.id] = {
          likedUserIds: [],
          totalLikes: topicPost.actions_summary?.find((action) => action.id === 2)?.count || 0
        };

        const commentContent = preprocessMarkup(topicPost.cooked);

        const parentPost = posts.find((_topicPost) => _topicPost.post_number === topicPost.reply_to_post_number);

        const postAuthor = await fetchAndStoreUser({
          userId: topicPost.user_id,
          username: topicPost.username
        });

        if (!postAuthor) {
          continue;
        }

        const postComment = await prisma.postComment.create({
          data: {
            content: commentContent,
            contentText: htmlToText(topicPost.cooked),
            parentId:
              topicPost.reply_to_post_number === null ? null : parentPost ? postCommentRecord[parentPost.id]?.id : null,
            postId: post.id,
            createdBy: postAuthor.id,
            createdAt: new Date(Date.now() + topicPost.post_number)
          }
        });

        postCommentRecord[topicPost.id] = postComment;
      }
      topicCounter += 1;
      console.log(`${topicCounter}/${totalTopics} topics created`);
    }

    const users = Object.values(discourseUserRecord);
    let userCounter = 0;
    let totalUsers = users.length;

    while (userCounter < totalUsers) {
      const user = users[userCounter];
      if (!user) {
        break;
      }

      await rateLimiter();
      const userActions = await GET<{ user_actions: UserAction[] }>(
        `https://${community}/user_actions.json?username=${user.username}`,
        {}
      );
      // action_type === 2 is post like
      const postLikeUserActions = userActions.user_actions.filter((userAction) => userAction.action_type === 2);

      for (const postLikeUserAction of postLikeUserActions) {
        const childPost = topicPostsRecord[postLikeUserAction.topic_id].posts?.find(
          (childPost) => childPost.id === postLikeUserAction.post_id
        );
        const rootPost = topicPostsRecord[postLikeUserAction.topic_id].posts?.find(
          (topicPost) => topicPost.post_number === 1
        );

        if (!childPost || !rootPost) {
          continue;
        }

        const topicAuthor = await fetchAndStoreUser({
          userId: postLikeUserAction.acting_user_id,
          username: postLikeUserAction.acting_username,
          postFetchUserCb(fetchedUser) {
            totalUsers += 1;
            users.push(fetchedUser);
          }
        });

        if (!topicAuthor) {
          continue;
        }

        // Reaction for the root post would be stored in the model postUpDownVote
        if (childPost.post_number === 1) {
          await prisma.postUpDownVote.create({
            data: {
              postId: postRecord[rootPost.id].id,
              createdBy: topicAuthor.id,
              upvoted: true
            }
          });
          postLikesRecord[rootPost.id].likedUserIds.push(topicAuthor.id);
        } else {
          await prisma.postCommentUpDownVote.create({
            data: {
              postId: postRecord[rootPost.id].id,
              commentId: postCommentRecord[childPost.id].id,
              createdBy: topicAuthor.id,
              upvoted: true
            }
          });
          postLikesRecord[childPost.id].likedUserIds.push(topicAuthor.id);
        }
      }
      userCounter += 1;
      console.log(`${userCounter}/${totalUsers} user actions created`);
    }

    for (const [postId, { likedUserIds, totalLikes }] of Object.entries(postLikesRecord)) {
      const post = postRecord[postId];
      const postComment = postCommentRecord[postId];

      if (likedUserIds.length === 0) {
        continue;
      }

      if (likedUserIds.length < totalLikes) {
        log.warn(`[discourse]: Post:${postId} likes count doesn't match with the number of liked users`);
        const difference = totalLikes - likedUserIds.length;
        const usersWhoDidNotLike = users
          .filter((user) => !likedUserIds.includes(userRecord[user.id].id))
          .slice(0, difference);
        for (const user of usersWhoDidNotLike) {
          // If it was a top level post
          if (post) {
            await prisma.postUpDownVote.create({
              data: {
                postId: post.id,
                createdBy: userRecord[user.id].id,
                upvoted: true
              }
            });
          } else if (postComment) {
            await prisma.postCommentUpDownVote.create({
              data: {
                postId: postComment.postId,
                commentId: postComment.id,
                createdBy: userRecord[user.id].id,
                upvoted: true
              }
            });
          }
        }
      }
    }
  } catch (err) {
    log.error(`[discourse]`, err);
  }
}

importFromDiscourse('forum.game7.io', 'game7');
