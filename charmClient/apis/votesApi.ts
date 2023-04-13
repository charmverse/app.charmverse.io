import type { UserVote } from '@prisma/client';

import * as http from 'adapters/http';
import type { ExtendedVote, UpdateVoteDTO, UserVoteExtendedDTO, VoteDTO } from 'lib/votes/interfaces';

export class VotesApi {
  getVotesByPage(query: { postId?: string; pageId?: string }) {
    return http.GET<ExtendedVote[]>(`/api/votes`, query);
  }

  createVote(votePayload: VoteDTO) {
    return http.POST<ExtendedVote>('/api/votes', votePayload);
  }

  updateVote(voteId: string, { status, deadline }: Partial<UpdateVoteDTO>) {
    return http.PUT(`/api/votes/${voteId}`, {
      status,
      deadline
    });
  }

  deleteVote(voteId: string) {
    return http.DELETE(`/api/votes/${voteId}`);
  }

  castVote(voteId: string, choice: string) {
    return http.POST<UserVote>(`/api/votes/${voteId}/cast`, {
      choice
    });
  }

  getUserVotes(voteId: string) {
    return http.GET<UserVoteExtendedDTO[]>(`/api/votes/${voteId}/user-votes`);
  }
}
