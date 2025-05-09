import { gql } from '@apollo/client';

import client from './graphql-client';

export type SnapshotVotingPower = {
  vp: number;
  vpByStrategy: number[];
  vpState: string;
};

export async function getVotingPower({
  snapshotProposalId,
  walletAddress,
  snapshotSpaceDomain
}: {
  snapshotProposalId: string;
  walletAddress: string;
  snapshotSpaceDomain: string;
}): Promise<SnapshotVotingPower> {
  const {
    data: { vp }
  } = await client.query<{ vp: { vp: number; vp_by_strategy: number[]; vp_state: string } }>({
    query: gql`
      query VotingPower {
        vp(
          voter: "${walletAddress}"
          space: "${snapshotSpaceDomain}"
          proposal: "${snapshotProposalId}"
        ) {
          vp
          vp_by_strategy
          vp_state
        }
      }
    `
  });

  return {
    vp: vp.vp,
    vpByStrategy: vp.vp_by_strategy,
    vpState: vp.vp_state
  };
}
