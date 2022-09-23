import { useEditorViewContext } from '@bangle.dev/react';
import type { EditorState } from '@bangle.dev/pm';
import { Box, Stack } from '@mui/material';
import { Check, Close, RateReviewOutlined } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import Button from 'components/common/Button';
import { useContributors } from 'hooks/useContributors';
import { accept } from 'components/common/CharmEditor/components/suggestions/track/accept';
import { acceptAll } from 'components/common/CharmEditor/components/suggestions/track/acceptAll';
import { reject } from 'components/common/CharmEditor/components/suggestions/track/reject';
import { rejectAll } from 'components/common/CharmEditor/components/suggestions/track/rejectAll';
import { getTracksFromDoc } from 'components/common/CharmEditor/components/suggestions/track/getTracks';
import log from 'lib/log';
import SuggestionCard from 'components/common/CharmEditor/components/suggestions/SuggestionCard';
import { NoCommentsMessage } from './CommentsSidebar';

export default function SuggestionsSidebar ({ readOnly, state }: { readOnly: boolean, state: EditorState | null }) {
  const view = useEditorViewContext();
  const [contributors] = useContributors();

  const [suggestions, setSuggestions] = useState<ReturnType<typeof getTracksFromDoc>>([]);

  // listen to changes on the doc like when suggestions are added/deleted
  useEffect(() => {
    if (view.state) {
      setSuggestions(getTracksFromDoc({ state: view.state }));
    }
  }, [view.state.doc]);

  // listen to changes from selection (see CharmEditor)
  useEffect(() => {
    if (state) {
      setSuggestions(getTracksFromDoc({ state }));
    }
  }, [state]);

  // console.log('suggestions', suggestions);

  function clickAcceptAll () {
    acceptAll(view);
  }

  function clickRejectAll () {
    rejectAll(view);
  }

  function acceptOne (type: string, pos: number) {
    accept(type, pos, view);
  }

  function rejectOne (type: string, pos: number) {
    reject(type, pos, view);
  }

  return (
    <>
      {!readOnly && suggestions.length > 0 && (
        <Box display='flex' gap={1} flexDirection='row' position='absolute' top={0} right={8}>
          <Button size='small' startIcon={<Check />} disableElevation variant='text' color='primary' onClick={clickAcceptAll}>
            Accept All
          </Button>
          <Button size='small' startIcon={<Close />} disableElevation variant='text' color='primary' onClick={clickRejectAll}>
            Reject All
          </Button>
        </Box>
      )}
      <Stack gap={2}>
        {suggestions.map(props => <SuggestionCard key={props.pos + props.type} {...props} />)}
      </Stack>
      {suggestions.length === 0 && (
        <NoCommentsMessage
          icon={(
            <RateReviewOutlined
              fontSize='large'
              color='secondary'
              sx={{
                height: '2em',
                width: '2em'
              }}
            />
          )}
          message='No suggestions yet'
        />
      )}
    </>
  );
}
