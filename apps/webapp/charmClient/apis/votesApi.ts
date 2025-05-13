import type { UserVote } from '@charmverse/core/prisma';
import * as http from '@packages/adapters/http';

import type { ExtendedVote, UpdateVoteDTO, UserVoteExtendedDTO, VoteDTO } from '@packages/lib/votes/interfaces';

export class VotesApi {
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

  castVote(voteId: string, choices: string[]) {
    return http.POST<UserVote>(`/api/votes/${voteId}/cast`, {
      choices
    });
  }

  getUserVotes(voteId: string) {
    return http.GET<UserVoteExtendedDTO[]>(`/api/votes/${voteId}/user-votes`);
  }
}
