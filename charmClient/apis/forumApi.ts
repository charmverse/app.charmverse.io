import * as http from 'adapters/http';
import type { ForumPost } from 'lib/forum/interfaces';

export class ForumApi {

  listForumPosts (spaceId: string, sort?: string, category?: string, count?: number, page?: number)
  : Promise<ForumPost[]> {
    return http.GET('/api/forum/posts', { spaceId, sort, category, count, page });
  }

  listPostCategories (spaceId: string): Promise<string[]> {
    return http.GET('/api/forum/categories', { spaceId });
  }
}

