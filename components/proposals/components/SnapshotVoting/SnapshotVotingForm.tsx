import { log } from '@charmverse/core/log';
import { Divider, Stack, Typography } from '@mui/material';
import { useState } from 'react';

import { Button } from 'components/common/Button';
import type { CastVote } from 'components/proposals/components/SnapshotVoting/hooks/useSnapshotVoting';
import { MultiChoiceVoting } from 'components/proposals/components/SnapshotVoting/MultiChoiceVoting';
import { RankedVoting } from 'components/proposals/components/SnapshotVoting/RankedVoting';
import { SingleChoiceVoting } from 'components/proposals/components/SnapshotVoting/SingleChoiceVoting';
import { WeightedVoting } from 'components/proposals/components/SnapshotVoting/WeightedVoting';
import { useSnackbar } from 'hooks/useSnackbar';
import type { SnapshotVote } from 'lib/snapshot/getVotes';
import type { SnapshotProposal, VoteChoice } from 'lib/snapshot/interfaces';

export type SnapshotVotingProps = {
  snapshotProposal: SnapshotProposal;
  votingPower: number;
  userVotes: SnapshotVote[] | undefined;
  castVote: CastVote;
};

export type SetVoteChoice = (voteChoice: VoteChoice | null) => void;

export type VoteChoiceFormProps = {
  voteChoice: VoteChoice | null;
  setVoteChoice: SetVoteChoice;
};

export function SnapshotVotingForm(props: SnapshotVotingProps) {
  const [voteChoice, setVoteChoice] = useState<null | VoteChoice>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { showMessage } = useSnackbar();

  const onVote = async () => {
    if (voteChoice === null) return;
    try {
      setIsSaving(true);
      await props?.castVote(voteChoice);

      showMessage('Vote casted', 'success');
    } catch (err: any) {
      if (err.message?.includes('ACTION_REJECTED')) return;

      log.error('[snapshot] Error while casting vote', err);

      const errorToShow = (err as any)?.error_description
        ? `Snapshot error: ${err?.error_description}`
        : 'There was an error casting your vote. Please try again later.';

      showMessage(errorToShow, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const isSupported = ['single-choice', 'basic', 'approval', 'weighted', 'quadratic', 'ranked-choice'].includes(
    props.snapshotProposal.type
  );

  return (
    <Stack sx={{ pointerEvents: !props.votingPower ? 'none' : 'auto', opacity: !props.votingPower ? 0.5 : 1 }}>
      <Stack px={1}>
        {isSupported ? (
          <>
            <RenderFormComponent {...props} voteChoice={voteChoice} setVoteChoice={setVoteChoice} />
            <Stack flex={1} direction='row' justifyContent='flex-end' alignItems='center' spacing={1}>
              <Button
                sx={{ px: 5, mt: 0.5, mb: 1 }}
                disabled={voteChoice === null || !props.votingPower}
                onClick={onVote}
                loading={isSaving}
              >
                Vote
              </Button>
            </Stack>
          </>
        ) : (
          <Typography sx={{ my: 2 }}>Unsupported voting type. Plese visit snapshot to vote</Typography>
        )}
      </Stack>
      <Divider sx={{ mt: 1 }} />
    </Stack>
  );
}

function RenderFormComponent(props: SnapshotVotingProps & VoteChoiceFormProps) {
  switch (props.snapshotProposal.type) {
    case 'single-choice':
    case 'basic':
      return <SingleChoiceVoting {...props} />;
    case 'approval':
      return <MultiChoiceVoting {...props} />;
    case 'ranked-choice':
      return <RankedVoting {...props} />;
    case 'quadratic':
    case 'weighted':
      return <WeightedVoting {...props} />;

    default:
      return null;
  }
}
