import type { Application, Space } from '@prisma/client';

import * as http from 'adapters/http';
import type { ApplicationWithTransactions, ReviewDecision, SubmissionContent, SubmissionCreationData } from 'lib/applications/interfaces';
import type { AssignedBountyPermissions, BountyCreationData, BountyUpdate, SuggestionAction, BountyWithDetails } from 'lib/bounties';
import type { ForumPost } from 'lib/forum/interfaces';
import type { Resource } from 'lib/permissions/interfaces';
import type { PublicBountyToggle } from 'lib/spaces/interfaces';
import type { TransactionCreationData } from 'lib/transactions/interface';

export class ForumApi {

  listForumPosts (spaceId: string, filter?: string, category?: string, publicOnly?: boolean): Promise<ForumPost[]> {
    return http.GET('/api/forum/posts', { spaceId, filter, category, publicOnly });
  }

  listPostCategories (spaceId: string, publicOnly?: boolean): Promise<string[]> {
    return http.GET('/api/forum/categories', { spaceId, publicOnly });
  }
}

