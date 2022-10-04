
import type { UserVote } from '@prisma/client';

import * as http from 'adapters/http';
import type { ExtendedVote, UserVoteExtendedDTO, VoteDTO } from 'lib/votes/interfaces';

export class VotesApi {
  getVotesByPage (pageId: string) {
    return http.GET<ExtendedVote[]>(`/api/pages/${pageId}/votes`);
  }

  getVotesBySpace (spaceId: string) {
    return http.GET<ExtendedVote[]>(`/api/spaces/${spaceId}/votes`);
  }

  createVote (votePayload: VoteDTO) {
    return http.POST<ExtendedVote>('/api/votes', votePayload);
  }

  cancelVote (voteId: string) {
    return http.PUT(`/api/votes/${voteId}`, {
      status: 'Cancelled'
    });
  }

  deleteVote (voteId: string) {
    return http.DELETE(`/api/votes/${voteId}`);
  }

  castVote (voteId: string, choice: string) {
    return http.POST<UserVote>(`/api/votes/${voteId}/cast`, {
      choice
    });
  }

  getUserVotes (voteId: string) {
    return http.GET<UserVoteExtendedDTO[]>(`/api/votes/${voteId}/user-votes`);
  }
}
