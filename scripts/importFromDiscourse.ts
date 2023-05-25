import { User as CharmverseUser, Post as CharmversePost, PostCategory, PostComment, PostTag, prisma } from '@charmverse/core/prisma-client'
import { breadcrumbsClasses } from '@mui/material'
import fetch from "adapters/http/fetch.server"
// import { parseMarkdown } from 'lib/prosemirror/plugins/markdown/parseMarkdown'

type User = {
  id: number
  username: string
  name?: string
  avatar_template: string
  flair_name: null | string
  admin?: boolean
  moderator?: boolean
  trust_level: number
}

type Poster = {
  extras: string
  description: string
  user_id: number
  primary_group_id?: number | null
  flair_group_id?: number | null
}

type Topic = {
  id: number
  title: string
  fancy_title: string
  slug: string
  posts_count: number
  reply_count: number
  highest_post_number: number
  image_url: string | null
  created_at: string
  last_posted_at: string
  bumped: boolean
  bumped_at: string
  archetype: string
  unseen: boolean
  pinned: boolean
  unpinned: boolean | null
  excerpt: string
  visible: boolean
  closed: boolean
  archived: boolean
  bookmarked: boolean | null
  liked: boolean | null
  tags: string[]
  tags_descriptions: Record<string, string>
  views: number
  like_count: number
  has_summary: boolean
  last_poster_username: string
  category_id: number
  pinned_globally: boolean
  featured_link: string | null
  posters: Poster[]
}

type Category = {
  id: number,
  name: string,
  color: string,
  text_color: string,
  slug: string,
  topic_count: number,
  post_count: number,
  position: number,
  description: string,
  description_text: string,
  description_excerpt: string,
  topic_url: string | null,
  read_restricted: boolean,
  permission: string | null,
  notification_level: number,
  topic_template: string | null,
  has_children: boolean,
  sort_order: string | null,
  sort_ascending: boolean | null,
  show_subcategory_list: boolean,
  num_featured_topics: number,
  default_view: string | null,
  subcategory_list_style: string,
  default_top_period: string,
  default_list_filter: string,
  minimum_required_tags: number,
  navigate_to_first_post_after_read: boolean,
  topics_day: number,
  topics_week: number,
  topics_month: number,
  topics_year: number,
  topics_all_time: number,
  is_uncategorized: boolean,
  subcategory_ids: number[],
  uploaded_logo: string | null,
  uploaded_background: string | null,
}

type Tag = {
  id: string,
  text: string,
  name: string,
  description: string | null,
  count: number,
  pm_count: number,
  target_tag: string | null,
}

type Post = {
  id: number,
  name: string,
  username: string,
  avatar_template: string,
  created_at: string,
  cooked: string,
  post_number: number,
  post_type: number,
  updated_at: string,
  reply_count: number,
  reply_to_post_number: number | null,
  quote_count: number,
  incoming_link_count: number,
  reads: number,
  readers_count: number,
  score: number,
  yours: boolean,
  topic_id: number,
  topic_slug: string,
  topic_title: string,
  topic_html_title: string,
  category_id: number,
  display_username: string,
  primary_group_name: string | null,
  flair_name: string | null,
  flair_url: string | null,
  flair_bg_color: string | null,
  flair_color: string | null,
  version: number,
  can_edit: boolean,
  can_delete: boolean,
  can_recover: boolean,
  can_wiki: boolean,
  user_title: string | null,
  bookmarked: boolean,
  raw: string,
  actions_summary?: { id: number, count: number }[],
  moderator: boolean,
  admin: boolean,
  staff: boolean,
  user_id: number,
  hidden: boolean,
  trust_level: number,
  deleted_at: string | null,
  user_deleted: boolean,
  edit_reason: string | null,
  can_view_edit_history: boolean,
  wiki: boolean,
}

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
}

async function createCharmverseUser ({avatar_template, community, spaceId, username}: {avatar_template: string, username: string, spaceId: string, community: string}) {
  const charmverseUser = await prisma.user.create({
    data: {
      username: `${username} (Imported)`,
      path: username.toLowerCase(),
      avatar: `https://${community}${avatar_template.replace('{size}', '80')}`,
      isBot: true
    }
  })

  await prisma.spaceRole.create({
    data: {
      userId: charmverseUser.id,
      spaceId
    }
  })

  return charmverseUser
}

export async function importFromDiscourse(community: string, spaceDomain: string) {
  try {
    const space = await prisma.space.findFirstOrThrow({
      where: {
        domain: spaceDomain
      }
    })
  
    const spaceId = space.id
    
    const {category_list: {categories}} = await fetch<{
      category_list: {
        categories: Category[]
      }
    }>(`https://${community}/categories.json`)
  
    const {tags} = await fetch<{tags: Tag[]}>(`https://${community}/tags.json`)
  
    const postTags: PostTag[] = [];
    const postTagRecord: Record<string, PostTag> = {}
  
    for (const tag of tags) {
      const postTag = await prisma.postTag.create({
        data: {
          name: tag.name,
          spaceId
        }
      })
      postTags.push(postTag)
      postTagRecord[tag.id] = postTag
    }

    const postCategories: PostCategory[] = []
    const forumCategoriesRecord: Record<string, PostCategory> = {}

    for (const category of categories) {
      const postCategory = await prisma.postCategory.create({
        data: {
          name: category.name,
          spaceId,
          description: category.description_text,
          path: category.slug,
        }
      })
      postCategories.push(postCategory)
      forumCategoriesRecord[category.id] = postCategory
    }
  
    const topics: Topic[] = []
    const posts: Post[] = []
    const topicPostRecord: Record<string, Post[]> = {}
    const discourseUserRecord: Record<string, User> = {};
    const discourseCharmverseUserRecord: Record<string, CharmverseUser> = {};
    const postRecord: Record<string, CharmversePost> = {};
    const commentRecord: Record<string, PostComment> = {}
  
    for (const categoryId in forumCategoriesRecord) {
      const {topic_list: {topics: fetchedTopics}} = await fetch<{users: User[], topic_list: {topics: Topic[]}}>(`https://${community}/c/${categoryId}.json`);
      for (const topic of fetchedTopics) {
        const {post_stream: {posts: fetchedPosts}} = await fetch<{post_stream: {posts: Post[]}}>(`https://${community}/t/${topic.id}.json`)
        posts.push(...fetchedPosts)
        topicPostRecord[topic.id] = fetchedPosts
      }
  
      topics.push(...fetchedTopics)
    }
  
    for (const topic of topics) {
      const topicPosts = topicPostRecord[topic.id]
      const topicPost = topicPosts[0]
      const content = topicPost.cooked.replace(/<[^>]*>/g, "");
      if (!discourseCharmverseUserRecord[topicPost.user_id]) {
        const fetchedUser = (await fetch<{user: User}>(`https://${community}/users/${topicPost.username}.json`)).user
        discourseCharmverseUserRecord[topicPost.user_id] = await createCharmverseUser({
          community,
          spaceId,
          username: fetchedUser.username,
          avatar_template: fetchedUser.avatar_template
        })
        discourseUserRecord[topicPost.user_id] = fetchedUser
      }
      const topicAuthor = discourseCharmverseUserRecord[topicPost.user_id];
      if (topicAuthor) {
        const post = await prisma.post.create({
          data: {
            title: topic.title,
            path: topic.slug,
            categoryId: forumCategoriesRecord[topic.category_id].id,
            spaceId,
            contentText: content,
            content: {
              type: 'doc',
              content: [
                {
                  type: "paragraph",
                  content: [{
                    type: 'text',
                    text: content
                  }]
                }
              ]
            },
            createdBy: topicAuthor.id,
            postToPostTags: {
              createMany: {
                data: topic.tags.map(tagId => ({postTagId: postTagRecord[tagId].id}))
              }
            }
          }
        })
    
        for (const topicPost of topicPosts) {
          if (topicPost.post_number !== 1) {
            // Write regex to remove all html tags and just get the text
            const content = topicPost.cooked.replace(/<[^>]*>/g, "");
            const parentPost = topicPosts.find(_topicPost => _topicPost.post_number === topicPost.reply_to_post_number);
            
            if (!discourseCharmverseUserRecord[topicPost.user_id]) {
              const fetchedUser = (await fetch<{user: User}>(`https://${community}/users/${topicPost.username}.json`)).user
              discourseCharmverseUserRecord[topicPost.user_id] = await createCharmverseUser({
                community,
                spaceId,
                username: fetchedUser.username,
                avatar_template: fetchedUser.avatar_template
              })
              discourseUserRecord[topicPost.user_id] = fetchedUser
            }
            const topicAuthor = discourseCharmverseUserRecord[topicPost.user_id];

            if (topicAuthor) {
              const postComment = await prisma.postComment.create({
                data: {
                  content: {
                    type: 'doc',
                    content: [
                      {
                        type: "paragraph",
                        content: [{
                          type: 'text',
                          text: content
                        }]
                      }
                    ]
                  },
                  contentText: content,
                  parentId: topicPost.reply_to_post_number === null ? null : parentPost ? commentRecord[parentPost.id]?.id : null,
                  postId: post.id,
                  createdBy: discourseCharmverseUserRecord[topicPost.user_id].id
                }
              })
      
              commentRecord[topicPost.id] = postComment
            }
          }
          postRecord[topicPost.id] = post
        }
      }
    }

    const users = Object.values(discourseUserRecord);

    while (users.length) {
      const user = users.pop();
      if (user) {
        const userActions = await fetch<{user_actions: UserAction[]}>(`https://${community}/user_actions.json?username=${user.username}`)
        const postLikeUserActions = userActions.user_actions.filter(userAction => userAction.action_type === 2)
        for (const postLikeUserAction of postLikeUserActions) {
          const topicPost = topicPostRecord[postLikeUserAction.topic_id]?.find(topicPost => topicPost.id === postLikeUserAction.post_id)
          const firstPost = topicPostRecord[postLikeUserAction.topic_id]?.find(topicPost => topicPost.post_number === 1)
          if (topicPost && firstPost) {
            if (!discourseCharmverseUserRecord[postLikeUserAction.acting_user_id]) {
              const fetchedUser = (await fetch<{user: User}>(`https://${community}/users/${postLikeUserAction.acting_username}.json`)).user
              discourseCharmverseUserRecord[postLikeUserAction.acting_user_id] = await createCharmverseUser({
                community,
                spaceId,
                username: fetchedUser.username,
                avatar_template: fetchedUser.avatar_template
              })
              discourseUserRecord[postLikeUserAction.acting_user_id] = fetchedUser
              users.push(fetchedUser)
            }
            const topicAuthor = discourseCharmverseUserRecord[postLikeUserAction.acting_user_id];
            if (topicAuthor) {
              // Reaction for the first post would be stored in the model postUpDownVote
              if (topicPost.post_number === 1) {
                await prisma.postUpDownVote.create({
                  data: {
                    postId: postRecord[topicPost.id].id,
                    createdBy: topicAuthor.id,
                    upvoted: true,
                  }
                })
              } else {
                await prisma.postCommentUpDownVote.create({
                  data: {
                    postId: postRecord[firstPost.id].id,
                    commentId: commentRecord[topicPost.id].id,
                    createdBy: topicAuthor.id,
                    upvoted: true,
                  }
                })
              }
            }
          }
        }
      } else {
        break;
      }
    }
  } catch (err) {
    console.log(err)
  }
}

importFromDiscourse("forum.game7.io", "shaky-pumpanddump-crocodile")