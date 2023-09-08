import type { PageComment, Proposal } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { ProposalWithCommentsAndUsers } from '@charmverse/core/proposals';

import { getPermissionsClient } from 'lib/permissions/api';
import { getProposalComments, getProposalCommentMentions } from 'lib/proposal/getProposalTasks';

import type { SpaceRecord, GetDiscussionsResponse, GetDiscussionsInput, Discussion } from './getDiscussionTasks';
import type { DiscussionPropertiesFromPage } from './getPropertiesFromPage';

export type NotificationProposalData = Pick<Proposal, 'id' | 'createdBy' | 'spaceId'> & {
  page: DiscussionPropertiesFromPage & { comments: PageComment[] };
};

export type ProposalDiscussionNotificationsContext = {
  userId: string;
  spaceRecord: SpaceRecord;
  username: string;
  proposals: NotificationProposalData[];
};

export async function getProposalDiscussionTasks({
  spaceIds,
  userId,
  spaceRecord,
  username
}: GetDiscussionsInput): Promise<GetDiscussionsResponse> {
  const { mentions, discussionUserIds, comments } = {
    mentions: [] as Discussion[],
    discussionUserIds: [] as string[],
    comments: [] as Discussion[]
  };

  for (const spaceId of spaceIds) {
    const userProposalIds = (await getPermissionsClient({ resourceId: spaceId, resourceIdType: 'space' }).then(
      ({ client }) =>
        client.proposals.getAccessibleProposalIds({
          userId,
          spaceId
        })
    )) as ProposalWithCommentsAndUsers[];

    const proposals = (await prisma.proposal.findMany({
      where: {
        spaceId,
        id: {
          in: userProposalIds.map(({ id }) => id)
        }
      },
      select: {
        id: true,
        createdBy: true,
        // spaceId: true,
        page: {
          select: {
            id: true,
            spaceId: true,
            title: true,
            path: true,
            bountyId: true,
            comments: true
          }
        }
      }
    })) as NotificationProposalData[];

    const context: ProposalDiscussionNotificationsContext = { userId, username, spaceRecord, proposals };

    // aggregate the results
    [getProposalComments(context), getProposalCommentMentions(context)].forEach((result) => {
      mentions.push(...result.mentions);
      discussionUserIds.push(...result.discussionUserIds);
      comments.push(...result.comments);
    });
  }

  return {
    mentions,
    discussionUserIds,
    comments
  };
}
