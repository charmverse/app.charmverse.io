import type { EditorState } from '@bangle.dev/pm';
import { useEditorViewContext } from '@bangle.dev/react';
import { Check, Close, RateReviewOutlined } from '@mui/icons-material';
import { Box, Stack } from '@mui/material';
import { useEffect, useState } from 'react';

import Button from 'components/common/Button';
import type { TrackedEvent } from 'components/common/CharmEditor/components/suggestions/getEvents';
import { getEventsFromDoc } from 'components/common/CharmEditor/components/suggestions/getEvents';
import { activateTrack } from 'components/common/CharmEditor/components/suggestions/statePlugins/track/helpers';
import { SuggestionCard } from 'components/common/CharmEditor/components/suggestions/SuggestionCard';
import { acceptAll } from 'components/common/CharmEditor/components/suggestions/track/acceptAll';
import { rejectAll } from 'components/common/CharmEditor/components/suggestions/track/rejectAll';
import { useUser } from 'hooks/useUser';

import { NoCommentsMessage } from './CommentsSidebar';

export function SuggestionsSidebar ({ readOnly, state }: { readOnly: boolean, state: EditorState | null }) {
  const view = useEditorViewContext();

  const { user } = useUser();
  const [suggestions, setSuggestions] = useState<TrackedEvent[]>([]);

  // listen to changes on the doc like when suggestions are added/deleted
  useEffect(() => {
    const marks = getEventsFromDoc({ state: view.state }).map(r => r.marks).flat();
    setSuggestions(marks);
  }, [view.state.doc]);

  // listen to changes from selection (see CharmEditor)
  useEffect(() => {
    if (state) {
      const marks = getEventsFromDoc({ state }).map(r => r.marks).flat();
      setSuggestions(marks);
    }
  }, [state]);

  // console.log('suggestions', suggestions);

  function clickAcceptAll () {
    acceptAll(view);
  }

  function clickRejectAll () {
    rejectAll(view);
  }

  function highlightMark (mark: TrackedEvent) {
    activateTrack(view, mark.type, mark.pos);
  }

  return (
    <>
      {!readOnly && suggestions.length > 0 && (
        <Box display='flex' gap={1} flexDirection='row'>
          <Button size='small' startIcon={<Check />} disableElevation variant='text' color='secondary' onClick={clickAcceptAll}>
            Accept All
          </Button>
          <Button size='small' startIcon={<Close />} disableElevation variant='text' color='secondary' onClick={clickRejectAll}>
            Reject All
          </Button>
        </Box>
      )}
      <Stack gap={2}>
        {suggestions.map(mark => (
          <div onClick={() => highlightMark(mark)} key={mark.pos}>
            <SuggestionCard
              key={mark.pos + mark.type}
              {...mark}
              readOnly={readOnly}
              isOwner={mark.data.user === user?.id}
            />
          </div>
        ))}
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
