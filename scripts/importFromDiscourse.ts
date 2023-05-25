import { User as CharmverseUser, PostCategory, PostComment, PostTag, prisma } from '@charmverse/core/src/prisma-client'
import fetch from "adapters/http/fetch.server"
import { parseMarkdown } from 'lib/prosemirror/plugins/markdown/parseMarkdown'

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
  actions_summary: { id: number, count: number }[],
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

export async function importFromDiscourse(community: string, spaceDomain: string) {
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
  const forumCategoriesRecord: Record<string, {
    charmverse: PostCategory,
    discourse: Category
  }> = {}

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
    forumCategoriesRecord[category.id] = {
      charmverse: postCategory,
      discourse: category
    }
    forumCategoriesRecord[postCategory.id] = {
      charmverse: postCategory,
      discourse: category
    }
  }

  const topics: Topic[] = []
  const posts: Post[] = []
  const topicPostRecord: Record<string, Post[]> = {}
  const discourseUserRecord: Record<string, User> = {};
  const discourseCharmverseUserRecord: Record<string, CharmverseUser> = {};

  for (const categoryId in forumCategoriesRecord) {
    const {topic_list: {topics: fetchedTopics, users: fetchedUsers}} = await fetch<{topic_list: {users: User[], topics: Topic[]}}>(`https://${community}/c/${categoryId}.json`);
    for (const topic of fetchedTopics) {
      const {post_stream: {posts: fetchedPosts}} = await fetch<{post_stream: {posts: Post[]}}>(`https://${community}/t/${topic.id}.json`)
      posts.push(...fetchedPosts)
      topicPostRecord[topic.id] = fetchedPosts
    }

    topics.push(...fetchedTopics)

    fetchedUsers.forEach(user => {
      discourseUserRecord[user.id] = user
    })
  }

  const users = Object.values(discourseUserRecord)
  for (const user of users) {
    const charmverseUser = await prisma.user.create({
      data: {
        username: `${user.username} (Imported)`,
        path: user.username,
        avatar: user.avatar_template.replace('{size}', '80'),
        isBot: true
      }
    })

    await prisma.spaceRole.create({
      data: {
        userId: charmverseUser.id,
        spaceId
      }
    })

    discourseCharmverseUserRecord[user.id] = charmverseUser
  }

  for (const topic of topics) {
    const commentRecord: Record<string, PostComment> = {}
    const topicPosts = topicPostRecord[topic.id]
    const topicPost = topicPosts[0]
    const content = parseMarkdown(topicPost.cooked)
    const post = await prisma.post.create({
      data: {
        title: topic.title,
        path: topic.slug,
        categoryId: forumCategoriesRecord[topic.category_id].charmverse.id,
        spaceId,
        contentText: topicPost.cooked,
        content,
        createdBy: discourseCharmverseUserRecord[topicPost.user_id].id,
        postToPostTags: {
          createMany: {
            data: postTags.map(tag => ({postTagId: postTagRecord[tag.id].id}))
          }
        }
      }
    })

    const totalLikeCounts = topic.like_count

    // Create PostUpDownVote model records based on the total like counts
    for (let i = 1; i <= totalLikeCounts; i += 1) {
      await prisma.postUpDownVote.create({
        data: {
          postId: post.id,
          createdBy: discourseCharmverseUserRecord[topicPost.user_id].id,
          upvoted: true,
        }
      })
    }

    for (const topicPost of topicPosts) {
      if (topicPost.post_number !== 1) {
        const content = parseMarkdown(topicPost.cooked)
        const postComment = await prisma.postComment.create({
          data: {
            content,
            contentText: topicPost.cooked,
            parentId: topicPost.reply_to_post_number === null ? null : commentRecord[topicPost.reply_to_post_number].id,
            postId: post.id,
            createdBy: discourseCharmverseUserRecord[topicPost.user_id].id
          }
        })

        commentRecord[topicPost.post_number] = postComment
        // Need to create updownvote for each comment, like_count is not available in the topicPost
      }
    }
  }
}

importFromDiscourse("forum.game7.io", "150e54f8-c656-47f5-9caf-699d65829ce4")