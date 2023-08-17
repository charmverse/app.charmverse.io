import { log } from '@charmverse/core/log';
import { Divider, Stack, Typography } from '@mui/material';
import { useState } from 'react';

import { Button } from 'components/common/Button';
import type { CastVote } from 'components/proposals/components/SnapshotVoting/hooks/useSnapshotVoting';
import { MultiChoiceVoting } from 'components/proposals/components/SnapshotVoting/MultiChoiceVoting';
import { SingleChoiceVoting } from 'components/proposals/components/SnapshotVoting/SingleChoiceVoting';
import { useSnackbar } from 'hooks/useSnackbar';
import type { SnapshotProposal, SnapshotVote, VoteChoice } from 'lib/snapshot';

export type SnapshotVotingProps = {
  snapshotProposal: SnapshotProposal;
  votingPower: number;
  userVotes: SnapshotVote[] | undefined;
  castVote: CastVote;
};

export type SetVoteChoice = (voteChoice: VoteChoice) => void;

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

  // TEMP: Only support single-choice and basic voting
  const isSupported = ['single-choice', 'basic', 'approval'].includes(props.snapshotProposal.type);

  return (
    <Stack>
      <Stack px={1}>
        {isSupported ? (
          <>
            <RenderFormComponent {...props} voteChoice={voteChoice} setVoteChoice={setVoteChoice} />
            <Stack flex={1} direction='row' justifyContent='flex-end' alignItems='center' spacing={1}>
              <Button sx={{ px: 5, mt: 0.5, mb: 1 }} disabled={voteChoice === null} onClick={onVote} loading={isSaving}>
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
      return null;
    case 'quadratic':
    case 'weighted':
      return null;

    default:
      return null;
  }
}
